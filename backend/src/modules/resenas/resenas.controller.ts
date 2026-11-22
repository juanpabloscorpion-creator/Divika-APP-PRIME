import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ResenasService } from './resenas.service';
import { CrearResenaDto } from './dto';
import { JwtAuthGuard, ReqUsuario } from '../../common/jwt-auth.guard';

@Controller('resenas')
export class ResenasController {
  constructor(private service: ResenasService) {}

  // Reseñas de un negocio (público)
  @Get('negocio/:negocioId')
  listarPorNegocio(@Param('negocioId', ParseUUIDPipe) negocioId: string) {
    return this.service.listarPorNegocio(negocioId);
  }

  // Crear o actualizar mi reseña (requiere sesión)
  @UseGuards(JwtAuthGuard)
  @Post()
  crear(@Req() req: ReqUsuario, @Body() dto: CrearResenaDto) {
    return this.service.crear(req.user.sub, dto);
  }
}
