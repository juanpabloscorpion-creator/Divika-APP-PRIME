import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne, Point, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

// ===== Tablas del diagrama (divika.dbml) =====

export type RolUsuario = 'consumidor' | 'vendedor' | 'admin';
export type EstatusUsuario = 'activo' | 'suspendido' | 'eliminado';
export type CanalOtp = 'mensaje' | 'whatsapp' | 'voz' | 'correo';
export type Plataforma = 'ios' | 'android' | 'web';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'n_completo', type: 'varchar', length: 80 }) nCompleto: string;

  @Column({ type: 'varchar', length: 254, unique: true }) email: string;

  // NULL si usa SSO / passwordless
  @Column({ name: 'contraseña', type: 'text', nullable: true }) contrasena: string | null;

  @Index() @Column({ type: 'varchar', length: 16, nullable: true }) telefono: string | null;

  // Cuándo se verificó el teléfono (NULL = sin verificar)
  @Column({ name: 'verificacion_tel', type: 'timestamptz', nullable: true }) verificacionTel: Date | null;

  @Column({ name: 'cod_postal', type: 'varchar', length: 10, nullable: true }) codPostal: string | null;

  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326, nullable: true }) ubicacion: Point | null;

  @Column({ type: 'enum', enum: ['consumidor', 'vendedor', 'admin'], enumName: 'rol_usuario', default: 'consumidor' }) rol: RolUsuario;

  @Column({ type: 'enum', enum: ['activo', 'suspendido', 'eliminado'], enumName: 'estatus_usuario', default: 'activo' }) estatus: EstatusUsuario;

  @CreateDateColumn({ type: 'timestamptz' }) creada: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) actualizada: Date;
  @Column({ type: 'timestamptz', nullable: true }) eliminada: Date | null;
}

// Cuentas de Google / Apple / Facebook ligadas a un usuario
@Entity('autenticacion')
@Index(['provider', 'providerUserId'], { unique: true })
export class Autenticacion {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'CASCADE' }) @JoinColumn({ name: 'user_id' }) usuario: Usuario;
  @Column({ type: 'varchar', length: 20 }) provider: string;
  @Column({ name: 'provider_user_id', type: 'varchar', length: 255 }) providerUserId: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

@Entity('otp_codes')
@Index(['destination', 'createdAt'])
export class OtpCode {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'CASCADE' }) @JoinColumn({ name: 'user_id' }) usuario: Usuario | null;
  @Column({ name: 'user_id', type: 'uuid', nullable: true }) userId: string | null;
  // Teléfono E.164 (+52...) o correo
  @Column({ type: 'varchar', length: 254 }) destination: string;
  @Column({ name: 'code_hash', type: 'text' }) codeHash: string;
  @Column({ type: 'enum', enum: ['mensaje', 'whatsapp', 'voz', 'correo'], enumName: 'otp_channel' }) channel: CanalOtp;
  // login | signup | phone_verify
  @Column({ type: 'varchar', length: 30 }) purpose: string;
  @Column({ type: 'smallint', default: 0 }) attempts: number;
  @Column({ name: 'expires_at', type: 'timestamptz' }) expiresAt: Date;
  @Column({ name: 'consumed_at', type: 'timestamptz', nullable: true }) consumedAt: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'CASCADE' }) @JoinColumn({ name: 'user_id' }) usuario: Usuario;
  @Column({ name: 'token_hash', type: 'text', unique: true }) tokenHash: string;
  @Column({ name: 'user_agent', type: 'text', nullable: true }) userAgent: string | null;
  @Column({ type: 'inet', nullable: true }) ip: string | null;
  @Column({ name: 'expires_at', type: 'timestamptz' }) expiresAt: Date;
  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true }) revokedAt: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

@Entity('device_tokens')
export class DeviceToken {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @ManyToOne(() => Usuario, { nullable: false, onDelete: 'CASCADE' }) @JoinColumn({ name: 'user_id' }) usuario: Usuario;
  // FCM / APNs / Web Push
  @Column({ type: 'text', unique: true }) token: string;
  @Column({ type: 'enum', enum: ['ios', 'android', 'web'], enumName: 'plataforma' }) platform: Plataforma;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true }) lastUsedAt: Date | null;
}

// ===== Tabla extra (no está en el diagrama): datos de "Editar perfil" y preferencias =====
@Entity('user_profiles')
export class UserProfile {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' }) userId: string;
  @OneToOne(() => Usuario, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'user_id' }) usuario: Usuario;
  @Column({ name: 'birth_date', type: 'date', nullable: true }) birthDate: string | null;
  @Column({ type: 'varchar', length: 100, nullable: true }) city: string | null;
  @Column({ name: 'avatar_url', type: 'text', nullable: true }) avatarUrl: string | null;
  // Notificaciones y privacidad (ver cuenta/preferencias.ts)
  @Column({ type: 'jsonb', nullable: true }) preferences: Record<string, any> | null;
}
