import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AgendaClienteController, AgendaProveedorController, AgendaPublicaController } from './agenda.controller';
import { AgendaService } from './agenda.service';

@Module({
  imports: [AuthModule],
  controllers: [AgendaPublicaController, AgendaClienteController, AgendaProveedorController],
  providers: [AgendaService],
})
export class AgendaModule {}
