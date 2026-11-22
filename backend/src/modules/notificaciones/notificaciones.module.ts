import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificacionesController } from './notificaciones.controller';

// El servicio vive en base/notificaciones.service.ts (lo usan citas, mensajes y reseñas)
@Module({
  imports: [AuthModule],
  controllers: [NotificacionesController],
})
export class NotificacionesModule {}
