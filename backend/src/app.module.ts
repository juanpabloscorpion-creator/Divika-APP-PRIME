import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { opcionesBaseDeDatos } from './base-de-datos';
import { BaseModule } from './base/base.module';
import { AuthModule } from './modules/auth/auth.module';
import { NegociosModule } from './modules/negocios/negocios.module';
import { FavoritosModule } from './modules/favoritos/favoritos.module';
import { ResenasModule } from './modules/resenas/resenas.module';
import { CuentaModule } from './modules/cuenta/cuenta.module';
import { ProveedoresModule } from './modules/proveedores/proveedores.module';
import { AgendaModule } from './modules/agenda/agenda.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // lee backend/.env
    // PostgreSQL con las tablas del diagrama (docs/divika.dbml). Ver src/base-de-datos.ts
    TypeOrmModule.forRootAsync({ useFactory: opcionesBaseDeDatos }),
    BaseModule,
    AuthModule,
    NegociosModule,
    ResenasModule,
    FavoritosModule,
    ProveedoresModule,
    CuentaModule,
    AgendaModule,
    NotificacionesModule,
  ],
})
export class AppModule {}
