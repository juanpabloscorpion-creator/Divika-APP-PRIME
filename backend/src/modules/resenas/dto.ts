import { IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CrearResenaDto {
  @IsUUID('all', { message: 'Negocio no válido' })
  negocioId: string;

  @IsInt({ message: 'La calificación debe ser un número entero' })
  @Min(1, { message: 'La calificación mínima es 1 estrella' })
  @Max(5, { message: 'La calificación máxima es 5 estrellas' })
  calificacion: number;

  @IsOptional()
  @IsString({ message: 'El comentario debe ser texto' })
  @MaxLength(1000, { message: 'El comentario puede tener máximo 1000 caracteres' })
  comentario?: string;
}
