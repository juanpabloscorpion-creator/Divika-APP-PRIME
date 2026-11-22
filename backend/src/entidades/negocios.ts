import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne, Point, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from './usuarios';

// ===== Tablas del diagrama (divika.dbml) =====

export type EstatusNegocio = 'draft' | 'pending' | 'verificado' | 'rechazado' | 'suspendido';
export type OrigenNegocio = 'registro_propio' | 'precargado' | 'admin';
export type TipoFoto = 'logo' | 'cubrir' | 'galeria';

@Entity('categories')
export class Categoria {
  @PrimaryGeneratedColumn('uuid') id: string;
  // NULL = categoría principal; con valor = subcategoría
  @Column({ name: 'parent_id', type: 'uuid', nullable: true }) parentId: string | null;
  @ManyToOne(() => Categoria, { nullable: true, onDelete: 'CASCADE' }) @JoinColumn({ name: 'parent_id' }) parent: Categoria | null;
  @Column({ type: 'varchar', length: 80 }) name: string;
  @Column({ type: 'varchar', length: 100, unique: true }) slug: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

@Entity('businesses')
export class Negocio {
  @PrimaryGeneratedColumn('uuid') id: string;

  // NULL = precargado sin dueño
  @Index() @Column({ name: 'owner_id', type: 'uuid', nullable: true }) ownerId: string | null;
  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'owner_id' }) owner: Usuario | null;

  @Column({ name: 'trade_name', type: 'varchar', length: 100 }) tradeName: string;
  @Column({ type: 'varchar', length: 120, unique: true }) slug: string;
  @Column({ name: 'legal_name', type: 'varchar', length: 200, nullable: true }) legalName: string | null;
  // RFC, opcional al registrar
  @Column({ name: 'tax_id', type: 'varchar', length: 13, nullable: true }) taxId: string | null;
  @Column({ name: 'short_description', type: 'varchar', length: 250, nullable: true }) shortDescription: string | null;
  @Column({ name: 'phone_public', type: 'varchar', length: 16, nullable: true }) phonePublic: string | null;
  @Column({ type: 'varchar', length: 16, nullable: true }) whatsapp: string | null;
  @Column({ type: 'text', nullable: true }) website: string | null;
  @Column({ name: 'logo_url', type: 'text', nullable: true }) logoUrl: string | null;
  @Column({ name: 'cover_url', type: 'text', nullable: true }) coverUrl: string | null;
  @Index() @Column({ type: 'enum', enum: ['draft', 'pending', 'verificado', 'rechazado', 'suspendido'], enumName: 'estatus_negocio', default: 'draft' }) status: EstatusNegocio;
  @Column({ type: 'enum', enum: ['registro_propio', 'precargado', 'admin'], enumName: 'origen_negocio', default: 'registro_propio' }) source: OrigenNegocio;
  @Column({ type: 'varchar', length: 20, default: 'free' }) plan: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true }) deletedAt: Date | null;
}

@Entity('business_addresses')
export class DireccionNegocio {
  @PrimaryColumn({ name: 'business_id', type: 'uuid' }) businessId: string;
  @OneToOne(() => Negocio, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'business_id' }) negocio: Negocio;
  @Column({ type: 'varchar', length: 150 }) street: string;
  @Column({ name: 'ext_number', type: 'varchar', length: 20, nullable: true }) extNumber: string | null;
  @Column({ name: 'int_number', type: 'varchar', length: 20, nullable: true }) intNumber: string | null;
  @Column({ type: 'varchar', length: 100, nullable: true }) neighborhood: string | null;
  @Index() @Column({ name: 'postal_code', type: 'varchar', length: 10 }) postalCode: string;
  @Column({ type: 'varchar', length: 100 }) city: string;
  @Column({ type: 'varchar', length: 100 }) state: string;
  @Column({ type: 'char', length: 2, default: 'MX' }) country: string;
  // Point 4326, índice GIST
  @Index({ spatial: true }) @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326 }) location: Point;
}

@Entity('business_categories')
export class NegocioCategoria {
  @PrimaryColumn({ name: 'business_id', type: 'uuid' }) businessId: string;
  @PrimaryColumn({ name: 'category_id', type: 'uuid' }) categoryId: string;
  @ManyToOne(() => Negocio, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'business_id' }) negocio: Negocio;
  @ManyToOne(() => Categoria, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'category_id' }) categoria: Categoria;
  @Column({ name: 'is_primary', type: 'boolean', default: false }) isPrimary: boolean;
}

@Entity('business_hours')
@Index(['businessId', 'weekday'])
export class HorarioNegocio {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'business_id', type: 'uuid' }) businessId: string;
  @ManyToOne(() => Negocio, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'business_id' }) negocio: Negocio;
  // 0=domingo ... 6=sábado
  @Column({ type: 'smallint' }) weekday: number;
  @Column({ name: 'open_time', type: 'time', nullable: true }) openTime: string | null;
  @Column({ name: 'close_time', type: 'time', nullable: true }) closeTime: string | null;
  @Column({ name: 'is_closed', type: 'boolean', default: false }) isClosed: boolean;
}

@Entity('business_photos')
@Index(['businessId', 'type', 'position'])
export class FotoNegocio {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'business_id', type: 'uuid' }) businessId: string;
  @ManyToOne(() => Negocio, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'business_id' }) negocio: Negocio;
  @Column({ type: 'text' }) url: string;
  @Column({ type: 'enum', enum: ['logo', 'cubrir', 'galeria'], enumName: 'tipo_foto', default: 'galeria' }) type: TipoFoto;
  @Column({ type: 'smallint', default: 0 }) position: number;
  @Column({ name: 'mime_type', type: 'varchar', length: 30, nullable: true }) mimeType: string | null;
  // máx 5 MB
  @Column({ name: 'size_bytes', type: 'integer', nullable: true }) sizeBytes: number | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}

// ===== Tabla extra (no está en el diagrama): lo que el portal del proveedor captura y no cabe en businesses =====
@Entity('business_details')
export class DetalleNegocio {
  @PrimaryColumn({ name: 'business_id', type: 'uuid' }) businessId: string;
  @OneToOne(() => Negocio, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'business_id' }) negocio: Negocio;
  // Descripción larga del perfil (short_description es la de las tarjetas)
  @Column({ type: 'varchar', length: 600, nullable: true }) description: string | null;
  @Column({ name: 'public_email', type: 'varchar', length: 254, nullable: true }) publicEmail: string | null;
  // efectivo | transferencia | tarjeta (solo informativo: Divika no procesa pagos)
  @Column({ name: 'payment_methods', type: 'varchar', array: true, nullable: true }) paymentMethods: string[] | null;
  // Datos para pagar (CLABE, titular...). Privado salvo que show_payment_on_profile
  @Column({ name: 'payment_instructions', type: 'text', nullable: true }) paymentInstructions: string | null;
  @Column({ name: 'show_payment_on_profile', type: 'boolean', default: true }) showPaymentOnProfile: boolean;
  @Column({ name: 'home_service', type: 'boolean', default: false }) homeService: boolean;
  @Column({ name: 'address_references', type: 'varchar', length: 300, nullable: true }) addressReferences: string | null;
  // false = business_addresses.location es solo el centro de la ciudad (el negocio no ha marcado su punto)
  @Column({ name: 'location_confirmed', type: 'boolean', default: false }) locationConfirmed: boolean;
  @Column({ name: 'coverage_radius_km', type: 'smallint', nullable: true }) coverageRadiusKm: number | null;
  @Column({ name: 'coverage_zones', type: 'varchar', array: true, nullable: true }) coverageZones: string[] | null;
  // { duracionBase, intervaloMin, anticipacionHoras, maxDias }
  @Column({ name: 'booking_rules', type: 'jsonb', nullable: true }) bookingRules: { duracionBase: number; intervaloMin: number; anticipacionHoras: number; maxDias: number } | null;
  // [{ desde, hasta, motivo }] días sin atención
  @Column({ name: 'blocked_dates', type: 'jsonb', nullable: true }) blockedDates: { desde: string; hasta: string; motivo: string }[] | null;
  // El dueño pausó su perfil: no sale en el directorio
  @Column({ name: 'paused_at', type: 'timestamptz', nullable: true }) pausedAt: Date | null;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
