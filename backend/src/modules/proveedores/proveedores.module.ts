import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NegocioProveedorController } from './negocio-proveedor.controller';
import { NegocioProveedorService } from './negocio-proveedor.service';
import { ProveedoresController } from './proveedores.controller';

@Module({
  imports: [AuthModule],
  controllers: [ProveedoresController, NegocioProveedorController],
  providers: [NegocioProveedorService],
})
export class ProveedoresModule {}
