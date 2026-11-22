import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auditoria, RolUsuario, UserProfile, Usuario } from '../entidades';

// La API sigue hablando de 'cliente' y 'negocio'; en la base son 'consumidor' y 'vendedor'
export type RolApi = 'cliente' | 'negocio' | 'admin';
export const rolApi = (r: RolUsuario): RolApi => (r === 'vendedor' ? 'negocio' : r === 'consumidor' ? 'cliente' : 'admin');

// Nunca incluye la contraseña
export const datosPublicos = (u: Usuario, perfil?: UserProfile | null) => ({
  id: u.id,
  nombre: u.nCompleto,
  apellidos: null as string | null,
  avatarUrl: perfil?.avatarUrl ?? null,
  email: u.email,
  rol: rolApi(u.rol),
  telefono: u.telefono,
  telefonoVerificado: !!u.verificacionTel,
});

// Quita espacios, guiones y el prefijo +52 / 52 / 521: deja solo los 10 dígitos
export function normalizarTelefono(telefono: string) {
  let d = telefono.replace(/\D/g, '');
  if (d.length === 13 && d.startsWith('521')) d = d.slice(3);
  else if (d.length === 12 && d.startsWith('52')) d = d.slice(2);
  return d;
}

// Teléfono público de un negocio: solo dígitos y "+" (cabe en varchar(16))
export const telefonoNegocio = (t: string) => t.replace(/[^\d+]/g, '').slice(0, 16);

@Injectable()
export class UsuariosService {
  private log = new Logger('Auditoria');
  constructor(
    @InjectRepository(Usuario) public repo: Repository<Usuario>,
    @InjectRepository(UserProfile) private perfiles: Repository<UserProfile>,
    @InjectRepository(Auditoria) private auditoria: Repository<Auditoria>,
  ) {}

  // Usuario activo o 401 (el front cierra la sesión al recibirlo)
  async activo(id: string) {
    const u = await this.repo.findOneBy({ id });
    if (!u || u.estatus !== 'activo') throw new UnauthorizedException('Usuario no encontrado');
    return u;
  }

  perfil(userId: string) {
    return this.perfiles.findOneBy({ userId });
  }

  async guardarPerfil(userId: string, cambios: Partial<UserProfile>) {
    const actual = (await this.perfiles.findOneBy({ userId })) ?? this.perfiles.create({ userId });
    return this.perfiles.save(Object.assign(actual, cambios));
  }

  async borrarPerfil(userId: string) {
    await this.perfiles.delete({ userId });
  }

  // audit_log: quién hizo qué. Nunca rompe la acción
  async auditar(actorId: string | null, action: string, entity: string, entityId: string | null, diff?: Record<string, any>) {
    try {
      await this.auditoria.insert({ actorId, action, entity, entityId, diff: diff ?? null });
    } catch (e) {
      this.log.warn((e as Error).message);
    }
  }
}
