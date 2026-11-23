import { Type } from 'class-transformer';
import { Equals, IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';
import { CATEGORIAS } from '../negocios/categorias';

// 8 caracteres o más, al menos una mayúscula y un número (lo mismo que pide el front)
export const CONTRASENA_SEGURA = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
export const MENSAJE_CONTRASENA = 'La contraseña debe tener 8 caracteres o más, una mayúscula y un número';

export class LoginDto {
  @IsEmail({}, { message: 'Correo no válido' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Escribe tu contraseña' })
  password: string;
}

export class RegistroClienteDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(80, { message: 'El nombre puede tener máximo 80 caracteres' })
  nombre: string;

  @IsEmail({}, { message: 'Correo no válido' })
  email: string;

  @Matches(/^\d{10}$/, { message: 'Teléfono inválido. Escribe los 10 dígitos de tu número' })
  telefono: string;

  @IsString()
  @Matches(CONTRASENA_SEGURA, { message: MENSAJE_CONTRASENA })
  password: string;
}

export class NegocioProveedorDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del negocio es obligatorio' })
  @MaxLength(100, { message: 'El nombre del negocio puede tener máximo 100 caracteres' })
  nombre: string;

  @IsIn(CATEGORIAS, { message: 'Elige una categoría válida' })
  categoria: string;

  @IsOptional()
  @IsString()
  subcategoria?: string;

  @Matches(/^[0-9+()\-\s]{7,20}$/, { message: 'Teléfono no válido' })
  telefono: string;

  @IsString()
  @IsNotEmpty({ message: 'La ciudad es obligatoria' })
  @MaxLength(100)
  ciudad: string;

  @IsString()
  @IsNotEmpty({ message: 'La colonia es obligatoria' })
  @MaxLength(100)
  colonia: string;
}

// Registro de proveedor desde el sitio web (diseño "Crea tu cuenta de proveedor")
export class RegistroProveedorDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(40, { message: 'El nombre puede tener máximo 40 caracteres' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son obligatorios' })
  @MaxLength(39, { message: 'Los apellidos pueden tener máximo 39 caracteres' })
  apellidos: string;

  @IsEmail({}, { message: 'Correo no válido' })
  email: string;

  @IsString()
  @Matches(CONTRASENA_SEGURA, { message: MENSAJE_CONTRASENA })
  password: string;

  @ValidateNested()
  @Type(() => NegocioProveedorDto)
  negocio: NegocioProveedorDto;

  @Equals(true, { message: 'Debes aceptar los Términos y condiciones y el Aviso de privacidad' })
  aceptaTerminos: boolean;

  @IsOptional()
  @IsBoolean()
  recibirNovedades?: boolean;
}

// Google / Apple (aún responden 501)
export class GoogleLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'El token de Google es obligatorio' })
  token: string;
}

export class AppleLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'El token de Apple es obligatorio' })
  token: string;

  @IsOptional()
  @IsString()
  nombre?: string; // Apple a veces solo manda el nombre en el primer registro
}

// ==========================================
// ACCESO POR CÓDIGO (SMS o correo), sin sesión previa
// ==========================================

export class EnviarCodigoDto {
  @IsIn(['sms', 'email'], { message: 'El canal debe ser sms o email' })
  canal: 'sms' | 'email';

  // Teléfono (10 dígitos, se aceptan espacios y +52) o correo, según el canal
  @IsString()
  @IsNotEmpty({ message: 'Escribe tu teléfono o correo' })
  destino: string;
}

export class VerificarCodigoDto extends EnviarCodigoDto {
  @Matches(/^\d{4}$/, { message: 'El código tiene 4 dígitos' })
  codigo: string;
}

// Recuperar contraseña: 1) pedir código al correo  2) confirmarlo con la contraseña nueva
export class RecuperarDto {
  @IsEmail({}, { message: 'Correo no válido' })
  email: string;
}

export class RestablecerDto extends RecuperarDto {
  @Matches(/^\d{4}$/, { message: 'El código son 4 dígitos' })
  codigo: string;

  @IsString()
  @Matches(CONTRASENA_SEGURA, { message: MENSAJE_CONTRASENA })
  password: string;
}
