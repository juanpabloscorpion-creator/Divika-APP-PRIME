import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Negocio } from './negocios';
import { Usuario } from './usuarios';

// ===== Tablas del diagrama (divika.dbml) =====

export type EstadoRevision = 'pendiente' | 'publicado' | 'rechazado';
export type TipoContacto = 'llamada' | 'whatsapp' | 'web';

@Entity('favorites')
export class Favorito {
  @PrimaryColumn({ name: 'user_id', type: 'uuid' }) userId: string;
  @PrimaryColumn({ name: 'business_id', type: 'uuid' }) businessId: string;
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'user_id' }) usuario: Usuario;
  @ManyToOne(() => Negocio, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'business_id' }) negocio: Negocio;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

@Entity('reviews')
@Index(['userId', 'businessId'], { unique: true })
@Index(['businessId', 'status'])
export class Resena {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'user_id', type: 'uuid' }) userId: string;
  @Column({ name: 'business_id', type: 'uuid' }) businessId: string;
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'user_id' }) usuario: Usuario;
  @ManyToOne(() => Negocio, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'business_id' }) negocio: Negocio;
  // 1 a 5
  @Column({ type: 'smallint' }) rating: number;
  @Column({ type: 'text', nullable: true }) comment: string | null;
  @Column({ type: 'enum', enum: ['pendiente', 'publicado', 'rechazado'], enumName: 'estado_revision', default: 'pendiente' }) status: EstadoRevision;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}

@Entity('contact_events')
@Index(['businessId', 'createdAt'])
export class EventoContacto {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id: string;
  @Column({ name: 'user_id', type: 'uuid', nullable: true }) userId: string | null;
  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'user_id' }) usuario: Usuario | null;
  @Column({ name: 'business_id', type: 'uuid' }) businessId: string;
  @ManyToOne(() => Negocio, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'business_id' }) negocio: Negocio;
  @Column({ type: 'enum', enum: ['llamada', 'whatsapp', 'web'], enumName: 'tipo_contacto' }) type: TipoContacto;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

@Entity('audit_log')
@Index(['entity', 'entityId'])
export class Auditoria {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id: string;
  @Column({ name: 'actor_id', type: 'uuid', nullable: true }) actorId: string | null;
  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'actor_id' }) actor: Usuario | null;
  @Column({ type: 'varchar', length: 60 }) action: string;
  @Column({ type: 'varchar', length: 60 }) entity: string;
  @Column({ name: 'entity_id', type: 'uuid', nullable: true }) entityId: string | null;
  @Column({ type: 'jsonb', nullable: true }) diff: Record<string, any> | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

// ===== Tablas extra (no están en el diagrama) =====

// Respuesta pública del negocio a una reseña (portal → Reseñas)
@Entity('review_replies')
export class RespuestaResena {
  @PrimaryColumn({ name: 'review_id', type: 'uuid' }) reviewId: string;
  @OneToOne(() => Resena, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'review_id' }) resena: Resena;
  @Column({ type: 'text' }) body: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

// Visitas al perfil público (gráfica "Visitas a tu perfil" del portal)
@Entity('business_views')
@Index(['businessId', 'createdAt'])
export class VisitaNegocio {
  @PrimaryGeneratedColumn({ type: 'bigint' }) id: string;
  @Column({ name: 'business_id', type: 'uuid' }) businessId: string;
  @ManyToOne(() => Negocio, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'business_id' }) negocio: Negocio;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
