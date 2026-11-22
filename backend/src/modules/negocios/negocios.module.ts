import { Module } from '@nestjs/common';
import { CategoriasController } from './categorias.controller';
import { NegociosController } from './negocios.controller';
import { NegociosService } from './negocios.service';

@Module({
  controllers: [NegociosController, CategoriasController],
  providers: [NegociosService],
})
export class NegociosModule {}
