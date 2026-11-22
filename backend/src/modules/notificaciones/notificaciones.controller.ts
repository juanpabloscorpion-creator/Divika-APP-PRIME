import { Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, ReqUsuario } from '../../common/jwt-auth.guard';
import { NotificacionesService } from '../../base/notificaciones.service';

@UseGuards(JwtAuthGuard)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private s: NotificacionesService) {}

  @Get()
  listar(@Req() r: ReqUsuario) {
    return this.s.listar(r.user.sub);
  }
  @Post('leer-todas')
  leerTodas(@Req() r: ReqUsuario) {
    return this.s.leerTodas(r.user.sub);
  }
  @Post(':id/leer')
  leer(@Req() r: ReqUsuario, @Param('id', ParseUUIDPipe) id: string) {
    return this.s.leer(r.user.sub, id);
  }
}
