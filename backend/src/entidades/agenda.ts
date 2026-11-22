import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Negocio } from './negocios';
import { Usuario } from './usuarios';

// ===== Tablas extra (no están en el diagrama): servicios, citas, mensajes, avisos y formularios =====

export type Modalidad = 'local' | 'domicilio' | 'ambos';
// solicitada: espera respuesta del negocio · propuesta: el negocio sugirió otro horario y espera al cliente
export type EstadoCita = 'solicitada' | 'confirmada' | 'propuesta' | 'rechazada' | 'cancelada';
export type TipoNotificacion = 'cita' | 'mensaje' | 'resena';

// numeric llega de Postgres como texto: lo convertimos a número
const numero = { to: (v: number | null) => v, from: (v: string | null) => (v === null ? null : Number(v)) };

@Entity('services')
@Index(['businessId'])
export class Servicio {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'business_id', type: 'uuid' }) businessId: string;
  @ManyToOne(() => Negocio, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'business_id' }) negocio: Negocio;
  @Column({ type: 'varchar', length: 80 }) name: string;
  @Column({ type: 'varchar', length: 400, nullable: true }) description: string | null;
  // Pesos; NULL = "a consultar"
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, transformer: numero }) price: number | null;
  @Column({ name: 'duration_min', type: 'smallint', default: 60 }) durationMin: number;
  @Column({ type: 'varchar', length: 60, nullable: true }) category: string | null;
  @Column({ type: 'enum', enum: ['local', 'domicilio', 'ambos'], enumName: 'modalidad_servicio', default: 'local' }) modality: Modalidad;
  // Costo extra por ir al domicilio (NULL = sin costo)
  @Column({ name: 'travel_fee', type: 'numeric', precision: 10, scale: 2, nullable: true, transformer: numero }) travelFee: number | null;
  @Column({ type: 'varchar', length: 400, nullable: true }) instructions: string | null;
  @Column({ name: 'photo_url', type: 'text', nullable: true }) photoUrl: string | null;
  // Inactivo = no se muestra a los clientes
  @Column({ name: 'is_active', type: 'boolean', default: true }) isActive: boolean;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

@Entity('appointments')
@Index(['businessId', 'date'])
@Index(['clientId'])
export class Cita {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'business_id', type: 'uuid' }) businessId: string;
  @ManyToOne(() => Negocio, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'business_id' }) negocio: Negocio;
  @Column({ name: 'client_id', type: 'uuid' }) clientId: string;
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'client_id' }) cliente: Usuario;
  @Column({ name: 'service_id', type: 'uuid', nullable: true }) serviceId: string | null;
  @ManyToOne(() => Servicio, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'service_id' }) servicio: Servicio | null;
  @Column({ type: 'date' }) date: string;
  @Column({ name: 'start_time', type: 'time' }) startTime: string;
  @Column({ name: 'party_size', type: 'smallint', default: 1 }) partySize: number;
  @Column({ type: 'varchar', length: 300, nullable: true }) notes: string | null;
  // Cómo piensa pagar el cliente (informativo)
  @Column({ name: 'payment_method', type: 'varchar', length: 20, nullable: true }) paymentMethod: string | null;
  @Column({ type: 'enum', enum: ['solicitada', 'confirmada', 'propuesta', 'rechazada', 'cancelada'], enumName: 'estado_cita', default: 'solicitada' }) status: EstadoCita;
  @Column({ name: 'proposed_date', type: 'date', nullable: true }) proposedDate: string | null;
  @Column({ name: 'proposed_time', type: 'time', nullable: true }) proposedTime: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}

// Una conversación = un cliente con un negocio
@Entity('messages')
@Index(['businessId', 'clientId', 'createdAt'])
export class Mensaje {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'business_id', type: 'uuid' }) businessId: string;
  @ManyToOne(() => Negocio, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'business_id' }) negocio: Negocio;
  @Column({ name: 'client_id', type: 'uuid' }) clientId: string;
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'client_id' }) cliente: Usuario;
  @Column({ type: 'varchar', length: 10 }) sender: 'cliente' | 'negocio';
  @Column({ type: 'text' }) body: string;
  // La otra parte lo leyó
  @Column({ name: 'read_at', type: 'timestamptz', nullable: true }) readAt: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

// Aviso dentro de la web para un usuario (cliente o dueño de negocio)
@Entity('notifications')
@Index(['userId', 'createdAt'])
export class Notificacion {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'user_id', type: 'uuid' }) userId: string;
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'user_id' }) usuario: Usuario;
  @Column({ type: 'varchar', length: 20 }) type: TipoNotificacion;
  @Column({ type: 'varchar', length: 160 }) title: string;
  @Column({ type: 'varchar', length: 160, nullable: true }) detail: string | null;
  // Ruta del front a la que lleva el aviso
  @Column({ type: 'varchar', length: 200, nullable: true }) link: string | null;
  @Column({ name: 'read_at', type: 'timestamptz', nullable: true }) readAt: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

// "Soporte y ayuda" → reportar un problema
@Entity('support_reports')
export class ReporteProblema {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'user_id' }) usuario: Usuario;
  @Column({ type: 'varchar', length: 30 }) type: string;
  @Column({ type: 'varchar', length: 1000 }) description: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

// Formulario "Únete gratis" de la landing de proveedores (sin cuenta)
@Entity('provider_leads')
export class Interesado {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'business_name', type: 'varchar', length: 120 }) businessName: string;
  @Column({ type: 'varchar', length: 120 }) service: string;
  @Column({ type: 'varchar', length: 30 }) phone: string;
  @Column({ type: 'varchar', length: 80 }) city: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
