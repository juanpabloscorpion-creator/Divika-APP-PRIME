import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import { ENTIDADES } from './entidades';

// Conexión a PostgreSQL (local, Neon, Render, Supabase...). Solo se configura con variables de entorno:
//   DATABASE_URL  postgres://usuario:clave@host:5432/base   (en Neon agrega ?sslmode=require)
//   DB_SSL=true   fuerza SSL si tu proveedor lo pide y la URL no trae sslmode
// Las tablas se crean con las migraciones de src/migraciones (se corren solas al arrancar).
export function opcionesBaseDeDatos(): DataSourceOptions {
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL (ver backend/.env.example)');
  return {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {}),
    entities: ENTIDADES,
    migrations: [join(__dirname, 'migraciones', '*.{ts,js}')],
    uuidExtension: 'pgcrypto',
    synchronize: false,
    migrationsRun: true,
  };
}
