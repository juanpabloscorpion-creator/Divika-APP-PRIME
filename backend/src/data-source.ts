// Solo para la CLI de TypeORM (generar o correr migraciones a mano). La app usa base-de-datos.ts.
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { opcionesBaseDeDatos } from './base-de-datos';

export default new DataSource(opcionesBaseDeDatos());
