import { randomInt, randomUUID } from 'crypto';
import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable, NotImplementedException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { isEmail } from 'class-validator';
import { DataSource, IsNull, Repository } from 'typeorm';
import { CategoriasService, aSlug } from '../../base/categorias.service';
import { datosPublicos, normalizarTelefono, rolApi, telefonoNegocio, UsuariosService } from '../../base/usuarios';
import { CanalOtp, DetalleNegocio, DireccionNegocio, Negocio, NegocioCategoria, OtpCode, Usuario } from '../../entidades';
import { CENTRO } from '../negocios/negocios.seed';
import { AppleLoginDto, EnviarCodigoDto, GoogleLoginDto, LoginDto, RecuperarDto, RegistroClienteDto, RegistroProveedorDto, RestablecerDto, VerificarCodigoDto } from './dto';

const INTENTOS_MAX = 5;
const ESPERA_REENVIO_SEG = 60;
const VIGENCIA_CODIGO_MIN = 10;

// Teléfono E.164 para otp_codes.destination
export const e164 = (diezDigitos: string) => `+52${diezDigitos}`;
export const slugNegocio = (nombre: string) => `${aSlug(nombre).slice(0, 100) || 'negocio'}-${randomUUID().slice(0, 6)}`;

@Injectable()
export class AuthService {
  constructor(
    private usuarios: UsuariosService,
    private cats: CategoriasService,
    private jwt: JwtService,
    private ds: DataSource,
    @InjectRepository(OtpCode) private otps: Repository<OtpCode>,
  ) {}

  private get repo() {
    return this.usuarios.repo;
  }

  buscarPorEmail(email: string) {
    return this.repo.findOneBy({ email: email.trim().toLowerCase() });
  }

  // Solo cuentas activas: un teléfono puede quedar libre si su cuenta se eliminó
  buscarPorTelefono(telefono: string) {
    return this.repo.findOneBy({ telefono, estatus: 'activo' });
  }

  async registrarCliente(dto: RegistroClienteDto) {
    await this.verificarEmailLibre(dto.email);
    const telefono = normalizarTelefono(dto.telefono);
    if (await this.buscarPorTelefono(telefono)) throw new ConflictException('Ese teléfono ya está registrado');
    const usuario = await this.repo.save(
      this.repo.create({ nCompleto: dto.nombre.trim(), telefono, email: dto.email.trim().toLowerCase(), contrasena: await bcrypt.hash(dto.password, 10), rol: 'consumidor' }),
    );
    return this.respuesta(usuario);
  }

  // Alta de proveedor desde el sitio web: crea usuario y negocio en borrador (no sale en el directorio hasta publicar).
  // Todo en una transacción: si algo falla no se guarda nada.
  async registrarProveedor(dto: RegistroProveedorDto) {
    await this.verificarEmailLibre(dto.email);
    const n = dto.negocio;
    const { principal, sub } = this.cats.ids(n.categoria, n.subcategoria);
    const contrasena = await bcrypt.hash(dto.password, 10);
    const usuario = await this.ds.transaction(async (m) => {
      const nuevo = await m.save(
        m.create(Usuario, { nCompleto: `${dto.nombre.trim()} ${dto.apellidos.trim()}`.slice(0, 80), email: dto.email.trim().toLowerCase(), contrasena, rol: 'vendedor' }),
      );
      const tel = telefonoNegocio(n.telefono);
      const negocio = await m.save(
        m.create(Negocio, { ownerId: nuevo.id, tradeName: n.nombre.trim(), slug: slugNegocio(n.nombre), phonePublic: tel, whatsapp: tel, status: 'draft', source: 'registro_propio' }),
      );
      await m.insert(NegocioCategoria, [{ businessId: negocio.id, categoryId: principal, isPrimary: true }, ...(sub ? [{ businessId: negocio.id, categoryId: sub, isPrimary: false }] : [])]);
      // La dirección exacta y el punto en el mapa se completan después en el portal
      await m.insert(DireccionNegocio, {
        businessId: negocio.id, street: '', neighborhood: n.colonia.trim(), city: n.ciudad.trim(), state: 'Durango', postalCode: '',
        location: { type: 'Point', coordinates: [CENTRO.lng, CENTRO.lat] },
      });
      await m.insert(DetalleNegocio, { businessId: negocio.id, locationConfirmed: false });
      return nuevo;
    });
    await this.usuarios.auditar(usuario.id, 'registro_proveedor', 'usuarios', usuario.id);
    return this.respuesta(usuario);
  }

  async login(dto: LoginDto) {
    const usuario = await this.buscarPorEmail(dto.email);
    const ok = usuario?.estatus === 'activo' && usuario.contrasena && (await bcrypt.compare(dto.password, usuario.contrasena));
    if (!usuario || !ok) throw new UnauthorizedException('Correo o contraseña incorrectos');
    return this.respuesta(usuario);
  }

  async perfil(id: string) {
    const u = await this.usuarios.activo(id);
    return datosPublicos(u, await this.usuarios.perfil(id));
  }

  private async verificarEmailLibre(email: string) {
    if (await this.buscarPorEmail(email)) throw new ConflictException('Ese correo ya está registrado');
  }

  private async respuesta(usuario: Usuario) {
    const token = await this.jwt.signAsync({ sub: usuario.id, rol: rolApi(usuario.rol) });
    return { token, usuario: datosPublicos(usuario, await this.usuarios.perfil(usuario.id)) };
  }

  // ==========================================
  // ACCESO POR CÓDIGO (SMS o correo) — tabla otp_codes
  // ==========================================

  // Pide un código de 4 dígitos. Responde igual exista o no la cuenta, para no revelar quién está registrado.
  async enviarCodigo(dto: EnviarCodigoDto) {
    const { usuario, destino } = await this.buscarPorDestino(dto);
    if (usuario) await this.emitirCodigo({ userId: usuario.id, destino, canal: dto.canal === 'sms' ? 'mensaje' : 'correo', proposito: 'login' });
    else console.log(`[CÓDIGO SIMULADO] No hay una cuenta con ${destino}; no se envió nada`);
    return { enviado: true, segundosEspera: ESPERA_REENVIO_SEG };
  }

  // Valida el código y, si es correcto, inicia sesión (devuelve token + usuario)
  async verificarCodigo(dto: VerificarCodigoDto) {
    const { usuario, destino } = await this.buscarPorDestino(dto);
    if (!usuario) throw new BadRequestException('Código incorrecto');
    await this.comprobarCodigo(destino, 'login', dto.codigo);
    if (dto.canal === 'sms' && !usuario.verificacionTel) {
      usuario.verificacionTel = new Date();
      await this.repo.save(usuario);
    }
    return this.respuesta(usuario);
  }

  private async buscarPorDestino({ canal, destino }: EnviarCodigoDto) {
    if (canal === 'email') {
      const email = destino.trim().toLowerCase();
      if (!isEmail(email)) throw new BadRequestException('Correo no válido');
      const u = await this.buscarPorEmail(email);
      return { usuario: u?.estatus === 'activo' ? u : null, destino: email };
    }
    const telefono = normalizarTelefono(destino);
    if (!/^\d{10}$/.test(telefono)) throw new BadRequestException('Teléfono inválido. Verifica que el número sea correcto');
    return { usuario: await this.buscarPorTelefono(telefono), destino: e164(telefono) };
  }

  // Genera el código, guarda solo su hash y lo "envía". Un código por minuto por destino.
  async emitirCodigo(o: { userId: string; destino: string; canal: CanalOtp; proposito: 'login' | 'phone_verify' | 'password_reset' }) {
    const ultimo = await this.otps.findOne({ where: { destination: o.destino }, order: { createdAt: 'DESC' } });
    if (ultimo) {
      const pasaron = (Date.now() - ultimo.createdAt.getTime()) / 1000;
      if (pasaron < ESPERA_REENVIO_SEG) {
        throw new HttpException(`Puedes pedir otro código en ${Math.ceil(ESPERA_REENVIO_SEG - pasaron)} segundos`, HttpStatus.TOO_MANY_REQUESTS);
      }
    }
    // Un código nuevo invalida los anteriores del mismo destino y propósito
    await this.otps.update({ destination: o.destino, purpose: o.proposito, consumedAt: IsNull() }, { consumedAt: new Date() });
    const codigo = randomInt(0, 10000).toString().padStart(4, '0');
    await this.otps.insert({
      userId: o.userId, destination: o.destino, channel: o.canal, purpose: o.proposito,
      codeHash: await bcrypt.hash(codigo, 8), expiresAt: new Date(Date.now() + VIGENCIA_CODIGO_MIN * 60 * 1000),
    });
    // INTEGRACIÓN PENDIENTE (Twilio para SMS/WhatsApp, o un servicio de correo): aquí se enviaría.
    // Por ahora el código solo se imprime en la consola del backend.
    console.log(`[CÓDIGO SIMULADO] Código para ${o.destino}: ${codigo}`);
  }

  // Revisa vigencia, intentos y coincidencia; si todo está bien, consume el código y lo devuelve
  async comprobarCodigo(destino: string, proposito: string, codigo: string) {
    const otp = await this.otps.findOne({ where: { destination: destino, purpose: proposito, consumedAt: IsNull() }, order: { createdAt: 'DESC' } });
    if (!otp || new Date() > otp.expiresAt) throw new BadRequestException('El código expiró. Solicita uno nuevo');
    if (otp.attempts >= INTENTOS_MAX) throw new BadRequestException('Demasiados intentos. Solicita un código nuevo');
    if (!(await bcrypt.compare(codigo, otp.codeHash))) {
      await this.otps.update(otp.id, { attempts: otp.attempts + 1 });
      throw new BadRequestException('Código incorrecto');
    }
    await this.otps.update(otp.id, { consumedAt: new Date() });
    return otp;
  }

  async hayCodigoPendiente(destino: string, proposito: string, userId: string) {
    return this.otps.existsBy({ destination: destino, purpose: proposito, userId, consumedAt: IsNull() });
  }

  // ==========================================
  // RECUPERAR CONTRASEÑA — código al correo (otp_codes, purpose 'password_reset')
  // ==========================================

  // Responde igual exista o no la cuenta
  async recuperar(dto: RecuperarDto) {
    const email = dto.email.trim().toLowerCase();
    const u = await this.buscarPorEmail(email);
    if (u?.estatus === 'activo') await this.emitirCodigo({ userId: u.id, destino: email, canal: 'correo', proposito: 'password_reset' });
    else console.log(`[CÓDIGO SIMULADO] No hay una cuenta con ${email}; no se envió nada`);
    return { enviado: true, segundosEspera: 60 };
  }

  // Cambia la contraseña con el código y deja la sesión iniciada
  async restablecer(dto: RestablecerDto) {
    const email = dto.email.trim().toLowerCase();
    const u = await this.buscarPorEmail(email);
    if (!u || u.estatus !== 'activo') throw new BadRequestException('Código incorrecto');
    await this.comprobarCodigo(email, 'password_reset', dto.codigo);
    u.contrasena = await bcrypt.hash(dto.password, 10);
    await this.repo.save(u);
    await this.usuarios.auditar(u.id, 'restablecer_contrasena', 'usuarios', u.id);
    return this.respuesta(u);
  }

  // ==========================================
  // GOOGLE Y APPLE: PENDIENTES (tabla autenticacion lista)
  // ==========================================
  // Quedan desactivados hasta validar el token con la librería oficial (google-auth-library / JWT de Apple);
  // al validarlo se guarda (provider, provider_user_id) en la tabla autenticacion.

  loginGoogle(_dto: GoogleLoginDto): never {
    throw new NotImplementedException('Inicio de sesión con Google disponible próximamente');
  }

  loginApple(_dto: AppleLoginDto): never {
    throw new NotImplementedException('Inicio de sesión con Apple disponible próximamente');
  }
}
