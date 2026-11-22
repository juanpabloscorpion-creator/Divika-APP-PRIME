import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CuentaController, SoporteController } from './cuenta.controller';
import { CuentaService } from './cuenta.service';

@Module({
  imports: [AuthModule],
  controllers: [CuentaController, SoporteController],
  providers: [CuentaService],
})
export class CuentaModule {}
