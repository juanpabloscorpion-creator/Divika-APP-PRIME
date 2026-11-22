import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ENTIDADES } from '../entidades';
import { CategoriasService } from './categorias.service';
import { NegocioVistaService } from './negocio-vista.service';
import { NotificacionesService } from './notificaciones.service';
import { UsuariosService } from './usuarios';

// Repositorios de todas las tablas y servicios compartidos, disponibles en cualquier módulo
@Global()
@Module({
  imports: [TypeOrmModule.forFeature(ENTIDADES)],
  providers: [CategoriasService, NegocioVistaService, NotificacionesService, UsuariosService],
  exports: [TypeOrmModule, CategoriasService, NegocioVistaService, NotificacionesService, UsuariosService],
})
export class BaseModule {}
