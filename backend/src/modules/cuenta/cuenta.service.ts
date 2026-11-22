import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource, Repository } from 'typeorm';
import { normalizarTelefono, rolApi, UsuariosService } from '../../base/usuarios';
import { borrarFoto, guardarFoto } from '../../common/almacenamiento';
import { DeviceToken, Favorito, OtpCode, RefreshToken, ReporteProblema, Resena, UserProfile, Usuario } from '../../entidades';
import { AuthService, e164 } from '../auth/auth.service';
import { ActualizarCuentaDto, CambiarContrasenaDto, PreferenciasDto, ReporteDto } from './dto';
import { conIniciales } from './preferencias';

// Cuenta del usuario con sesión: perfil (usuarios + user_profiles), contraseña, teléfono, preferencias, datos y baja
@Injectable()
export class CuentaService {
  constructor(
    @InjectRepository(Resena) private resenas: Repository<Resena>,
    @InjectRepository(Favorito) private favoritos: Repository<Favorito>,
    @InjectRepository(ReporteProblema) private reportes: Repository<ReporteProblema>,
    private usuarios: UsuariosService,
    private auth: AuthService,
    private ds: DataSource,
  ) {}

  private get repo() {
    return this.usuarios.repo;
  }

  // Nunca incluye la contraseña ni datos de códigos
  private vista(u: Usuario, p: UserProfile | null) {
    return {
      id: u.id, nombre: u.nCompleto, apellidos: null as string | null, email: u.email, rol: rolApi(u.rol),
      telefono: u.telefono, telefonoVerificado: !!u.verificacionTel,
      fechaNacimiento: p?.birthDate ?? null, ciudad: p?.city ?? null, avatarUrl: p?.avatarUrl ?? null,
      tienePassword: !!u.contrasena, preferencias: conIniciales(p?.preferences), creadoEn: u.creada,
    };
  }

  async obtener(id: string) {
    const u = await this.usuarios.activo(id);
    return this.vista(u, await this.usuarios.perfil(id));
  }

  async actualizar(id: string, dto: ActualizarCuentaDto) {
    const u = await this.usuarios.activo(id);
    if (dto.email && dto.email.toLowerCase() !== u.email) {
      if (await this.repo.findOneBy({ email: dto.email.toLowerCase() })) throw new ConflictException('Ese correo ya está registrado');
      u.email = dto.email.toLowerCase();
    }
    if (dto.nombre !== undefined) u.nCompleto = dto.nombre.trim();
    await this.repo.save(u);
    const cambios: Partial<UserProfile> = {};
    if (dto.fechaNacimiento !== undefined) cambios.birthDate = dto.fechaNacimiento || null;
    if (dto.ciudad !== undefined) cambios.city = dto.ciudad.trim() || null;
    const p = Object.keys(cambios).length ? await this.usuarios.guardarPerfil(id, cambios) : await this.usuarios.perfil(id);
    return this.vista(u, p);
  }

  async cambiarFoto(id: string, archivo: Express.Multer.File | null) {
    const u = await this.usuarios.activo(id);
    const anterior = (await this.usuarios.perfil(id))?.avatarUrl;
    const url = archivo ? await guardarFoto(archivo, 'divika/avatares') : null;
    const p = await this.usuarios.guardarPerfil(id, { avatarUrl: url });
    await borrarFoto(anterior);
    return this.vista(u, p);
  }

  async cambiarContrasena(id: string, dto: CambiarContrasenaDto) {
    const u = await this.usuarios.activo(id);
    if (!u.contrasena) throw new BadRequestException('Tu cuenta entra con Google o Apple y no tiene contraseña');
    if (!(await bcrypt.compare(dto.actual, u.contrasena))) throw new BadRequestException('La contraseña actual no es correcta');
    if (await bcrypt.compare(dto.nueva, u.contrasena)) throw new BadRequestException('La contraseña nueva debe ser distinta a la actual');
    u.contrasena = await bcrypt.hash(dto.nueva, 10);
    await this.repo.save(u);
    return { ok: true };
  }

  // Cambiar teléfono: se manda un código al número nuevo (otp_codes, purpose phone_verify);
  // el teléfono de la cuenta solo cambia al confirmar el código
  async pedirCodigoTelefono(id: string, telefonoCrudo: string) {
    const u = await this.usuarios.activo(id);
    const telefono = normalizarTelefono(telefonoCrudo);
    if (telefono === u.telefono && u.verificacionTel) throw new BadRequestException('Ese ya es tu número verificado');
    const dueno = await this.auth.buscarPorTelefono(telefono);
    if (dueno && dueno.id !== id) throw new ConflictException('Ese teléfono ya está registrado');
    await this.auth.emitirCodigo({ userId: id, destino: e164(telefono), canal: 'mensaje', proposito: 'phone_verify' });
    return { enviado: true, segundosEspera: 60 };
  }

  async verificarTelefono(id: string, telefonoCrudo: string, codigo: string) {
    const u = await this.usuarios.activo(id);
    const telefono = normalizarTelefono(telefonoCrudo);
    if (!(await this.auth.hayCodigoPendiente(e164(telefono), 'phone_verify', id))) throw new BadRequestException('Primero solicita un código para ese número');
    await this.auth.comprobarCodigo(e164(telefono), 'phone_verify', codigo);
    const dueno = await this.auth.buscarPorTelefono(telefono);
    if (dueno && dueno.id !== id) throw new ConflictException('Ese teléfono ya está registrado');
    u.telefono = telefono;
    u.verificacionTel = new Date();
    await this.repo.save(u);
    return this.vista(u, await this.usuarios.perfil(id));
  }

  async preferencias(id: string) {
    await this.usuarios.activo(id);
    return conIniciales((await this.usuarios.perfil(id))?.preferences);
  }

  // Solo cambia las claves conocidas y booleanas; lo demás se ignora
  async guardarPreferencias(id: string, dto: PreferenciasDto) {
    await this.usuarios.activo(id);
    const actuales = conIniciales((await this.usuarios.perfil(id))?.preferences);
    for (const grupo of ['notificaciones', 'privacidad'] as const) {
      const nuevas = dto[grupo] ?? {};
      const destino = actuales[grupo] as Record<string, boolean>;
      for (const clave of Object.keys(destino)) if (typeof nuevas[clave] === 'boolean') destino[clave] = nuevas[clave];
    }
    await this.usuarios.guardarPerfil(id, { preferences: actuales });
    return actuales;
  }

  // "Descargar mis datos": una copia de lo que Divika guarda de la persona
  async exportarDatos(id: string) {
    const cuenta = await this.obtener(id);
    const resenas = await this.resenas.find({ where: { userId: id }, relations: { negocio: true } });
    const favoritos = await this.favoritos.find({ where: { userId: id }, relations: { negocio: true } });
    return {
      exportadoEn: new Date().toISOString(),
      cuenta,
      resenas: resenas.map((r) => ({ negocio: r.negocio.tradeName, calificacion: r.rating, comentario: r.comment, creadoEn: r.createdAt })),
      favoritos: favoritos.map((f) => ({ negocio: f.negocio.tradeName, guardadoEn: f.createdAt })),
    };
  }

  // Baja de cuenta (borrado lógico del diagrama: estatus 'eliminado' + eliminada).
  // Se quitan sus datos personales, reseñas, favoritos, perfil y códigos; sus citas y mensajes
  // quedan en el historial del negocio a nombre de "Cuenta eliminada".
  async eliminar(id: string) {
    const u = await this.usuarios.activo(id);
    if (u.rol !== 'consumidor') throw new ForbiddenException('Las cuentas de proveedor se dan de baja escribiendo a soporte');
    const avatar = (await this.usuarios.perfil(id))?.avatarUrl;
    await this.ds.transaction(async (m) => {
      for (const t of [Resena, Favorito, OtpCode, RefreshToken, DeviceToken]) await m.createQueryBuilder().delete().from(t).where('user_id = :id', { id }).execute();
      await m.delete(UserProfile, { userId: id });
      await m.update(Usuario, id, {
        estatus: 'eliminado', eliminada: new Date(), nCompleto: 'Cuenta eliminada', email: `eliminada+${id}@divika.invalid`,
        contrasena: null, telefono: null, verificacionTel: null, codPostal: null, ubicacion: null,
      });
    });
    await this.usuarios.auditar(id, 'eliminar_cuenta', 'usuarios', id);
    await borrarFoto(avatar);
    return { ok: true };
  }

  async reportar(id: string, dto: ReporteDto) {
    const u = await this.usuarios.activo(id);
    await this.reportes.save(this.reportes.create({ type: dto.tipo, description: dto.descripcion.trim(), usuario: u }));
    return { ok: true };
  }
}
