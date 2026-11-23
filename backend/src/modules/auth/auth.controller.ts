import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AppleLoginDto, EnviarCodigoDto, GoogleLoginDto, LoginDto, RecuperarDto, RegistroClienteDto, RegistroProveedorDto, RestablecerDto, VerificarCodigoDto } from './dto';
import { JwtAuthGuard, ReqUsuario } from '../../common/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private service: AuthService) {}

  @Post('registro/cliente')
  registrarCliente(@Body() dto: RegistroClienteDto) {
    return this.service.registrarCliente(dto);
  }

  @Post('registro/proveedor')
  registrarProveedor(@Body() dto: RegistroProveedorDto) {
    return this.service.registrarProveedor(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  // Acceso por código: pedir y verificar (no requieren sesión)
  @Post('codigo/enviar')
  enviarCodigo(@Body() dto: EnviarCodigoDto) {
    return this.service.enviarCodigo(dto);
  }

  @Post('codigo/verificar')
  verificarCodigo(@Body() dto: VerificarCodigoDto) {
    return this.service.verificarCodigo(dto);
  }

  // Olvidé mi contraseña: pide un código al correo y luego lo confirma con la contraseña nueva
  @Post('recuperar')
  recuperar(@Body() dto: RecuperarDto) {
    return this.service.recuperar(dto);
  }

  @Post('recuperar/confirmar')
  restablecer(@Body() dto: RestablecerDto) {
    return this.service.restablecer(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: ReqUsuario) {
    return this.service.perfil(req.user.sub);
  }

  // Responden 501 hasta validar los tokens con la librería oficial
  @Post('google')
  loginGoogle(@Body() dto: GoogleLoginDto) {
    return this.service.loginGoogle(dto);
  }

  @Post('apple')
  loginApple(@Body() dto: AppleLoginDto) {
    return this.service.loginApple(dto);
  }
}
