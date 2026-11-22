import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CategoriasService } from '../../base/categorias.service';
import { NegocioVistaService } from '../../base/negocio-vista.service';
import { telefonoNegocio, UsuariosService } from '../../base/usuarios';
import { borrarFoto, guardarFoto } from '../../common/almacenamiento';
import { DetalleNegocio, DireccionNegocio, FotoNegocio, Negocio, NegocioCategoria, Servicio } from '../../entidades';
import { ahoraLocal } from '../agenda/disponibilidad';
import { CENTRO } from '../negocios/negocios.seed';
import { ActualizarPerfilDto } from './negocio-proveedor.dto';

export const MAX_FOTOS = 10;
const ZONA = process.env.TZ_NEGOCIOS || 'America/Mexico_City';

// "Mi negocio" del proveedor con sesión: todo opera sobre el negocio del que es dueño
@Injectable()
export class NegocioProveedorService {
  constructor(
    @InjectRepository(Negocio) private negocios: Repository<Negocio>,
    @InjectRepository(DireccionNegocio) private direcciones: Repository<DireccionNegocio>,
    @InjectRepository(DetalleNegocio) private detalles: Repository<DetalleNegocio>,
    @InjectRepository(FotoNegocio) private fotos: Repository<FotoNegocio>,
    @InjectRepository(Servicio) private servicios: Repository<Servicio>,
    private vistas: NegocioVistaService,
    private cats: CategoriasService,
    private usuarios: UsuariosService,
    private ds: DataSource,
  ) {}

  async obtener(userId: string) {
    return this.vistas.vista(await this.vistas.delDueno(userId), { privado: true });
  }

  // Visitas al perfil (business_views): últimos 14 días y comparación con los 7 anteriores
  async estadisticas(userId: string) {
    const n = await this.vistas.delDueno(userId);
    const filas: { fecha: string; total: number }[] = await this.ds.query(
      `SELECT to_char(created_at AT TIME ZONE $2, 'YYYY-MM-DD') AS fecha, COUNT(*)::int AS total
       FROM business_views WHERE business_id = $1 AND created_at > now() - interval '15 days' GROUP BY 1`,
      [n.id, ZONA],
    );
    const serie: { fecha: string; total: number }[] = [];
    const hoy = new Date(`${ahoraLocal().fecha}T12:00:00Z`);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(hoy);
      d.setUTCDate(d.getUTCDate() - i);
      const f = d.toISOString().slice(0, 10);
      serie.push({ fecha: f, total: filas.find((x) => x.fecha === f)?.total ?? 0 });
    }
    const suma = (l: { total: number }[]) => l.reduce((a, x) => a + x.total, 0);
    return { serie, visitas7: suma(serie.slice(7)), visitasPrevias7: suma(serie.slice(0, 7)) };
  }

  private async direccionDe(n: Negocio) {
    return (
      (await this.direcciones.findOneBy({ businessId: n.id })) ??
      this.direcciones.create({ businessId: n.id, street: '', postalCode: '', city: 'Durango', state: 'Durango', location: { type: 'Point', coordinates: [CENTRO.lng, CENTRO.lat] } })
    );
  }

  async actualizar(userId: string, dto: ActualizarPerfilDto) {
    const n = await this.vistas.delDueno(userId);
    const det = await this.vistas.detalle(n.id);
    const actual = await this.vistas.vista(n, { privado: true });

    // Categoría: si cambia la principal sin elegir subcategoría, la anterior ya no aplica
    if (dto.categoria !== undefined || dto.subcategoria !== undefined) {
      const categoria = dto.categoria ?? actual.categoria;
      const subcategoria = dto.subcategoria !== undefined ? dto.subcategoria || null : dto.categoria ? null : actual.subcategoria;
      const { principal, sub } = this.cats.ids(categoria, subcategoria);
      await this.ds.transaction(async (m) => {
        await m.delete(NegocioCategoria, { businessId: n.id });
        await m.insert(NegocioCategoria, [{ businessId: n.id, categoryId: principal, isPrimary: true }, ...(sub ? [{ businessId: n.id, categoryId: sub, isPrimary: false }] : [])]);
      });
    }

    // businesses
    if (dto.nombre !== undefined) n.tradeName = dto.nombre.trim();
    if (dto.telefono !== undefined) n.phonePublic = telefonoNegocio(dto.telefono);
    if (dto.whatsapp !== undefined) n.whatsapp = dto.whatsapp ? telefonoNegocio(dto.whatsapp) : null;
    await this.negocios.save(n);

    // business_addresses
    if ([dto.ciudad, dto.colonia, dto.calle, dto.latitud, dto.longitud].some((v) => v !== undefined)) {
      const dir = await this.direccionDe(n);
      if (dto.calle !== undefined) dir.street = dto.calle.trim();
      if (dto.colonia !== undefined) dir.neighborhood = dto.colonia.trim() || null;
      if (dto.ciudad !== undefined && dto.ciudad.trim()) dir.city = dto.ciudad.trim();
      if (dto.latitud !== undefined && dto.longitud !== undefined) {
        dir.location = { type: 'Point', coordinates: [dto.longitud, dto.latitud] };
        det.locationConfirmed = true;
      }
      await this.direcciones.save(dir);
    }

    // business_details
    if (dto.descripcion !== undefined) det.description = dto.descripcion.trim() || null;
    if (dto.emailPublico !== undefined) det.publicEmail = dto.emailPublico || null;
    if (dto.referencias !== undefined) det.addressReferences = dto.referencias.trim() || null;
    if (dto.metodosPago !== undefined) det.paymentMethods = dto.metodosPago;
    if (dto.instruccionesPago !== undefined) det.paymentInstructions = dto.instruccionesPago.trim() || null;
    if (dto.mostrarPagoPerfil !== undefined) det.showPaymentOnProfile = dto.mostrarPagoPerfil;
    if (dto.cobertura !== undefined) {
      det.coverageRadiusKm = dto.cobertura.radioKm;
      det.coverageZones = dto.cobertura.zonas.map((z) => z.trim()).filter(Boolean);
    }
    if (dto.atiendeDomicilio !== undefined) {
      det.homeService = dto.atiendeDomicilio;
      // Sin domicilio, los servicios a domicilio pasan a ser solo en el negocio
      if (!dto.atiendeDomicilio) await this.servicios.createQueryBuilder().update().set({ modality: 'local', travelFee: null }).where("business_id = :id AND modality != 'local'", { id: n.id }).execute();
    }
    await this.detalles.save(det);
    return this.obtener(userId);
  }

  // Lo mínimo para salir en el directorio
  private faltantes(v: Awaited<ReturnType<NegocioProveedorService['obtener']>>) {
    const f: string[] = [];
    if (!v.nombre?.trim()) f.push('el nombre del negocio');
    if (!v.descripcion?.trim()) f.push('la descripción');
    if (!v.telefono?.trim()) f.push('el teléfono');
    if (!v.galeria.length) f.push('al menos una foto');
    return f;
  }

  // draft → pending (publicado, en espera de verificación). Si estaba pausado, se reanuda.
  async publicar(userId: string) {
    const n = await this.vistas.delDueno(userId);
    if (n.status === 'suspendido') throw new ForbiddenException('Tu perfil está suspendido. Escribe a soporte para revisarlo');
    const f = this.faltantes(await this.vistas.vista(n, { privado: true }));
    if (f.length) throw new UnprocessableEntityException(`Antes de publicar agrega: ${f.join(', ')}.`);
    const antes = n.status;
    if (n.status === 'draft' || n.status === 'rechazado') n.status = 'pending';
    await this.negocios.save(n);
    const det = await this.vistas.detalle(n.id);
    det.pausedAt = null;
    await this.detalles.save(det);
    await this.usuarios.auditar(userId, 'publicar', 'businesses', n.id, { status: [antes, n.status] });
    return this.obtener(userId);
  }

  async pausar(userId: string) {
    const n = await this.vistas.delDueno(userId);
    const det = await this.vistas.detalle(n.id);
    if (this.vistas.estado(n, det) !== 'publicado') throw new BadRequestException('Solo puedes pausar un perfil publicado');
    det.pausedAt = new Date();
    await this.detalles.save(det);
    await this.usuarios.auditar(userId, 'pausar', 'businesses', n.id);
    return this.obtener(userId);
  }

  // ---------- Fotos (business_photos, tipo galeria). La primera es la portada (businesses.cover_url) ----------
  private async galeria(businessId: string) {
    return this.fotos.find({ where: { businessId, type: 'galeria' }, order: { position: 'ASC', createdAt: 'ASC' } });
  }

  private async reordenar(n: Negocio, lista: FotoNegocio[]) {
    await this.ds.transaction(async (m) => {
      for (const [i, f] of lista.entries()) if (f.position !== i) await m.update(FotoNegocio, f.id, { position: i });
      await m.update(Negocio, n.id, { coverUrl: lista[0]?.url ?? null });
    });
  }

  async agregarFoto(userId: string, archivo: Express.Multer.File) {
    const n = await this.vistas.delDueno(userId);
    const lista = await this.galeria(n.id);
    if (lista.length >= MAX_FOTOS) throw new BadRequestException(`Máximo ${MAX_FOTOS} fotos`);
    const url = await guardarFoto(archivo, 'divika/negocios');
    const nueva = await this.fotos.save(this.fotos.create({ businessId: n.id, url, type: 'galeria', position: lista.length, mimeType: archivo.mimetype, sizeBytes: archivo.size }));
    await this.reordenar(n, [...lista, nueva]);
    return this.obtener(userId);
  }

  async ordenarFotos(userId: string, orden: number[]) {
    const n = await this.vistas.delDueno(userId);
    const lista = await this.galeria(n.id);
    const valido = orden.length === lista.length && [...orden].sort((a, b) => a - b).every((v, i) => v === i);
    if (!valido) throw new BadRequestException('El orden de las fotos no es válido');
    await this.reordenar(n, orden.map((i) => lista[i]));
    return this.obtener(userId);
  }

  async quitarFoto(userId: string, indice: number) {
    const n = await this.vistas.delDueno(userId);
    const lista = await this.galeria(n.id);
    if (indice < 0 || indice >= lista.length) throw new NotFoundException('Foto no encontrada');
    const [quitada] = lista.splice(indice, 1);
    await this.fotos.delete(quitada.id);
    await this.reordenar(n, lista);
    await borrarFoto(quitada.url);
    return this.obtener(userId);
  }
}
