import { Body, Controller, Delete, Get, Post, Put, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { exigirFoto, subidaFoto } from '../../common/almacenamiento';
import { JwtAuthGuard, ReqUsuario as Req_ } from '../../common/jwt-auth.guard';
import { ActualizarCuentaDto, CambiarContrasenaDto, PedirCodigoTelefonoDto, PreferenciasDto, ReporteDto, VerificarTelefonoDto } from './dto';
import { CuentaService } from './cuenta.service';

@UseGuards(JwtAuthGuard)
@Controller('cuenta')
export class CuentaController {
  constructor(private service: CuentaService) {}

  @Get() obtener(@Req() req: Req_) { return this.service.obtener(req.user.sub); }

  @Put() actualizar(@Req() req: Req_, @Body() dto: ActualizarCuentaDto) { return this.service.actualizar(req.user.sub, dto); }

  // multipart/form-data con el campo "foto" (JPG o PNG, máx. 5 MB)
  @Post('foto')
  @UseInterceptors(subidaFoto())
  subirFoto(@Req() req: Req_, @UploadedFile() foto?: Express.Multer.File) {
    return this.service.cambiarFoto(req.user.sub, exigirFoto(foto));
  }

  @Delete('foto') quitarFoto(@Req() req: Req_) { return this.service.cambiarFoto(req.user.sub, null); }

  @Post('contrasena') contrasena(@Req() req: Req_, @Body() dto: CambiarContrasenaDto) { return this.service.cambiarContrasena(req.user.sub, dto); }

  @Post('telefono/codigo') pedirCodigo(@Req() req: Req_, @Body() dto: PedirCodigoTelefonoDto) { return this.service.pedirCodigoTelefono(req.user.sub, dto.telefono); }

  @Post('telefono/verificar') verificar(@Req() req: Req_, @Body() dto: VerificarTelefonoDto) { return this.service.verificarTelefono(req.user.sub, dto.telefono, dto.codigo); }

  @Get('preferencias') preferencias(@Req() req: Req_) { return this.service.preferencias(req.user.sub); }

  @Put('preferencias') guardarPreferencias(@Req() req: Req_, @Body() dto: PreferenciasDto) { return this.service.guardarPreferencias(req.user.sub, dto); }

  @Get('datos') datos(@Req() req: Req_) { return this.service.exportarDatos(req.user.sub); }

  @Delete() eliminar(@Req() req: Req_) { return this.service.eliminar(req.user.sub); }
}

@UseGuards(JwtAuthGuard)
@Controller('soporte')
export class SoporteController {
  constructor(private service: CuentaService) {}

  @Post('reportes') reportar(@Req() req: Req_, @Body() dto: ReporteDto) { return this.service.reportar(req.user.sub, dto); }
}
