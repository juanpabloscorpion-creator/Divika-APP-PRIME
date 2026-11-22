# Divika

Directorio de negocios locales. Monorepo con backend NestJS y frontend Next.js.

**Ramas:** `main` tiene solo el **sitio web**, que se adapta al tamaño de la ventana. La versión con diseño de app de celular está en la rama `movil`, y el backend anterior con SQLite en `backend-sqlite`.

```
divika/
├── backend/    NestJS + TypeORM + PostgreSQL/PostGIS   → http://localhost:3001
├── frontend/   Next.js (App Router)                    → http://localhost:3000
└── docs/       API, base de datos y diagrama (divika.dbml)
```

La base sigue el diagrama del equipo de backend ([`docs/divika.dbml`](docs/divika.dbml)) más 10 tablas extra; detalle en [`docs/base-de-datos.md`](docs/base-de-datos.md).

## Cómo correrlo (Node 20 o más nuevo)

**1. Base de datos PostgreSQL.** La forma más fácil es una base gratis en [Neon](https://neon.tech) (no instalas nada y es la misma que usarás en la nube): crea un proyecto, copia la *connection string* y pégala en `DATABASE_URL`. Si prefieres local, instala PostgreSQL con la extensión PostGIS y crea una base vacía.

**2. Backend y front:**

```bash
# Terminal 1
cd backend
cp .env.example .env      # pon DATABASE_URL y cambia JWT_SECRET
npm install
npm run start:dev         # crea las tablas solo (migraciones) y 48 negocios de ejemplo

# Terminal 2
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Abre http://localhost:3000.

**Si venías de la versión con SQLite:** las sesiones guardadas ya no sirven (los ids ahora son uuid). El sitio te regresa al login; vuelve a registrarte.

**Códigos de verificación:** aún no se envían por SMS ni correo. Al pedir un código, búscalo en la terminal del backend (`[CÓDIGO SIMULADO] Código para ...: 1234`).

## Dónde cambiar cosas

| Quiero cambiar…                 | Archivo |
|---------------------------------|---------|
| Colores, bordes, sombra, fuente | `frontend/src/styles/tokens.css` |
| Cómo se ve una card             | `frontend/src/styles/globals.css` (sección Card) |
| Logo                            | `frontend/public/logo.png` |
| Foto del banner de inicio       | `frontend/public/banner-inicio.png` (opcional; sin ella solo se ve el texto) |
| Categorías y subcategorías      | `backend/src/modules/negocios/categorias.ts` (el frontend las lee de `GET /categorias`) |
| Icono de una categoría          | `frontend/src/components/home/categoriaIconos.tsx` |
| Campos de registro              | `backend/src/modules/auth/dto.ts` + `frontend/src/components/forms/` |
| Tablas de la base               | `backend/src/entidades/` + una migración nueva (ver `docs/base-de-datos.md`) |

## Subirlo a la nube (gratis)

| Parte | Servicio | Qué configurar |
|---|---|---|
| Base de datos | [Neon](https://neon.tech) | Crear proyecto y copiar la connection string (`...?sslmode=require`) |
| Backend | [Render](https://render.com) | *New → Blueprint* con este repo (usa `render.yaml`). Variables: `DATABASE_URL` (Neon), `FRONTEND_URL` (la de Vercel), `PUBLIC_URL` (la de Render), `CLOUDINARY_URL` |
| Fotos | [Cloudinary](https://cloudinary.com) | Copiar la "API environment variable" a `CLOUDINARY_URL` (Render borra el disco al reiniciar) |
| Frontend | [Vercel](https://vercel.com) | Importar el repo con *Root Directory* `frontend` y `NEXT_PUBLIC_API_URL` = URL de Render |

El plan gratis de Render duerme el backend tras 15 min sin uso; la primera petición tarda cerca de un minuto. Antes de una presentación, abre la página un par de minutos antes.

## Documentación
- [API](docs/api.md)
- [Base de datos](docs/base-de-datos.md) · [diagrama original](docs/divika.dbml) · [diagrama completo](docs/divika-completo.dbml)
