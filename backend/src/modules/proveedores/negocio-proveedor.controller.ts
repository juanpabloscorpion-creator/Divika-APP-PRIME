import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { exigirFoto, subidaFoto } from '../../common/almacenamiento';
import { JwtAuthGuard, ReqUsuario } from '../../common/jwt-auth.guard';
import { ActualizarPerfilDto, OrdenFotosDto } from './negocio-proveedor.dto';
import { NegocioProveedorService } from './negocio-proveedor.service';

@UseGuards(JwtAuthGuard)
@Controller('proveedor/negocio')
export class NegocioProveedorController {
  constructor(private service: NegocioProveedorService) {}

  @Get()
  obtener(@Req() req: ReqUsuario) {
    return this.service.obtener(req.user.sub);
  }

  @Get('estadisticas')
  estadisticas(@Req() req: ReqUsuario) {
    return this.service.estadisticas(req.user.sub);
  }

  @Put()
  actualizar(@Req() req: ReqUsuario, @Body() dto: ActualizarPerfilDto) {
    return this.service.actualizar(req.user.sub, dto);
  }

  @Post('publicar')
  publicar(@Req() req: ReqUsuario) {
    return this.service.publicar(req.user.sub);
  }

  @Post('pausar')
  pausar(@Req() req: ReqUsuario) {
    return this.service.pausar(req.user.sub);
  }

  // multipart/form-data con el campo "foto" (JPG o PNG, máx. 5 MB). Devuelve el negocio actualizado
  @Post('fotos')
  @UseInterceptors(subidaFoto())
  subirFoto(@Req() req: ReqUsuario, @UploadedFile() foto?: Express.Multer.File) {
    return this.service.agregarFoto(req.user.sub, exigirFoto(foto));
  }

  // Debe ir antes de ":indice" para que "orden" no se tome como número
  @Put('fotos/orden')
  ordenar(@Req() req: ReqUsuario, @Body() dto: OrdenFotosDto) {
    return this.service.ordenarFotos(req.user.sub, dto.orden);
  }

  @Delete('fotos/:indice')
  quitar(@Req() req: ReqUsuario, @Param('indice', ParseIntPipe) indice: number) {
    return this.service.quitarFoto(req.user.sub, indice);
  }
}
