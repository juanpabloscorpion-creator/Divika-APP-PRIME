import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Negocio } from './negocios';
import { Usuario } from './usuarios';

// ===== Tablas del diagrama (divika.dbml). Aún sin rutas: el front muestra la verificación como "próximamente" =====

export type MetodoVerificacion = 'sms' | 'llamada' | 'documento';
export type EstadoSolicitud = 'pending' | 'aprobado' | 'rechazado' | 'expirado';
export type TipoDocumento = 'constancia_fiscal' | 'comprobante_domicilio';

const ESTADOS_SOLICITUD = ['pending', 'aprobado', 'rechazado', 'expirado'];

@Entity('verification_requests')
export class SolicitudVerificacion {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @ManyToOne(() => Negocio, { nullable: false, onDelete: 'CASCADE' }) @JoinColumn({ name: 'business_id' }) negocio: Negocio;
  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'requested_by' }) solicitadoPor: Usuario | null;
  @Column({ type: 'enum', enum: ['sms', 'llamada', 'documento'], enumName: 'metodo_verificacion' }) method: MetodoVerificacion;
  @Index() @Column({ type: 'enum', enum: ESTADOS_SOLICITUD, enumName: 'estado_solicitud', default: 'pending' }) status: EstadoSolicitud;
  @Column({ name: 'pin_hash', type: 'text', nullable: true }) pinHash: string | null;
  @Column({ type: 'smallint', default: 0 }) attempts: number;
  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true }) expiresAt: Date | null;
  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'reviewed_by' }) revisadoPor: Usuario | null;
  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true }) reviewedAt: Date | null;
  @Column({ name: 'reject_reason', type: 'text', nullable: true }) rejectReason: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

@Entity('verification_documents')
export class DocumentoVerificacion {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => SolicitudVerificacion, { nullable: false, onDelete: 'CASCADE' }) @JoinColumn({ name: 'request_id' }) solicitud: SolicitudVerificacion;
  @Column({ name: 'doc_type', type: 'enum', enum: ['constancia_fiscal', 'comprobante_domicilio'], enumName: 'tipo_documento' }) docType: TipoDocumento;
  @Column({ name: 'file_url', type: 'text' }) fileUrl: string;
  // máx 3 meses de antigüedad
  @Column({ name: 'issued_at', type: 'date' }) issuedAt: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

@Entity('business_claims')
export class ReclamoNegocio {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Negocio, { nullable: false, onDelete: 'CASCADE' }) @JoinColumn({ name: 'business_id' }) negocio: Negocio;
  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'CASCADE' }) @JoinColumn({ name: 'claimant_user_id' }) reclamante: Usuario;
  @ManyToOne(() => SolicitudVerificacion, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'verification_request_id' }) solicitud: SolicitudVerificacion | null;
  @Column({ type: 'enum', enum: ESTADOS_SOLICITUD, enumName: 'estado_solicitud', default: 'pending' }) status: EstadoSolicitud;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true }) resolvedAt: Date | null;
}
