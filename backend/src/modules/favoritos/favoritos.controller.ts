import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { FavoritosService } from './favoritos.service';
import { JwtAuthGuard, ReqUsuario } from '../../common/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('favoritos')
export class FavoritosController {
  constructor(private service: FavoritosService) {}

  @Get()
  listar(@Req() req: ReqUsuario) {
    return this.service.listar(req.user.sub);
  }

  @Post(':negocioId')
  agregar(@Req() req: ReqUsuario, @Param('negocioId', ParseUUIDPipe) negocioId: string) {
    return this.service.agregar(req.user.sub, negocioId);
  }

  @Delete(':negocioId')
  quitar(@Req() req: ReqUsuario, @Param('negocioId', ParseUUIDPipe) negocioId: string) {
    return this.service.quitar(req.user.sub, negocioId);
  }
}
