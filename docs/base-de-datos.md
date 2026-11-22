# Base de datos (PostgreSQL)

El backend usa **PostgreSQL + PostGIS** con el diagrama del equipo de backend:

- [`divika.dbml`](divika.dbml): diagrama original del equipo (18 tablas). Se respeta tal cual: nombres, tipos, enums, índices y llaves.
- [`divika-completo.dbml`](divika-completo.dbml): el mismo diagrama **más 10 tablas extra** para lo que el front ya hace y el diagrama no cubre. Se puede pegar en [dbdiagram.io](https://dbdiagram.io) para verlo.

Código: entidades en `backend/src/entidades/` (un archivo por área) y la migración que crea todo en `backend/src/migraciones/`. Las migraciones corren solas al arrancar el backend (`synchronize` está apagado).

## Tablas del diagrama y qué las usa

| Tabla | Uso en la app |
|---|---|
| `usuarios` | Cuentas. `rol`: `consumidor` = cliente, `vendedor` = proveedor. `n_completo` guarda nombre y apellidos juntos. `verificacion_tel` con fecha = teléfono verificado. Baja de cuenta = `estatus 'eliminado'` + `eliminada` (borrado lógico; se anonimizan correo, nombre y teléfono) |
| `otp_codes` | Códigos de 4 dígitos: entrar con código (`purpose 'login'`) y cambiar teléfono (`'phone_verify'`). `destination` en E.164 (`+52…`) o correo. 10 min de vigencia, 5 intentos, 1 envío por minuto |
| `categories` | Categorías (`parent_id` NULL) y subcategorías (con `parent_id`). Se siembran al arrancar desde `backend/src/modules/negocios/categorias.ts` |
| `businesses` | Negocio. `status`: `draft` (en alta) → `pending` al publicar (sale en el directorio mientras se verifica) → `verificado`. Los de ejemplo son `source 'precargado'`, `verificado` y sin dueño. `cover_url` = primera foto |
| `business_addresses` | Calle, colonia, ciudad, estado, CP y `location` (geography Point 4326, índice GIST) |
| `business_categories` | Categoría principal (`is_primary`) y subcategoría |
| `business_hours` | Un renglón por día (`weekday` 0 = domingo) |
| `business_photos` | Galería (`type 'galeria'`, `position`). Máx. 5 MB por foto |
| `favorites`, `reviews` | Favoritos y reseñas. Una reseña por persona y negocio (si vuelve a opinar se actualiza). La calificación del negocio es el promedio de sus reseñas `publicado` (no se guarda en `businesses`) |
| `contact_events` | Clics en WhatsApp y llamar (estadísticas del portal) |
| `audit_log` | Registro de alta de proveedor, publicar, pausar y baja de cuenta |
| `autenticacion`, `refresh_tokens`, `device_tokens`, `verification_requests`, `verification_documents`, `business_claims` | **Creadas, sin uso todavía**: Google/Apple, sesiones largas, push y verificación de negocios siguen como "próximamente" |

## Tablas extra (no están en el diagrama)

| Tabla | Por qué hace falta |
|---|---|
| `user_profiles` | Fecha de nacimiento, ciudad, foto y preferencias de "Editar perfil" |
| `business_details` | Descripción larga, correo público, formas e instrucciones de pago, atención a domicilio, referencias, cobertura, reglas de reserva, días bloqueados, pausa y si la ubicación ya la marcó el negocio (`location_confirmed`) |
| `services` | Servicios del negocio (precio, duración, modalidad, costo de traslado, foto) |
| `appointments` | Citas: `solicitada → confirmada / rechazada`, `propuesta`, `cancelada` |
| `messages` | Chat cliente ↔ negocio |
| `notifications` | Avisos dentro de la web |
| `review_replies` | Respuesta del negocio a una reseña |
| `business_views` | Visitas al perfil (gráfica del portal) |
| `support_reports` | "Reportar un problema" |
| `provider_leads` | Formulario "Únete gratis" de la landing |

## Decisiones para revisar con el equipo de backend

1. **`business_addresses.postal_code`, `state` y `location` son obligatorios**, pero el registro de proveedor solo pide ciudad y colonia. Al registrarse se guarda `postal_code ''`, `state 'Durango'` y `location` en el centro de Durango con `location_confirmed = false` (la API no muestra esas coordenadas hasta que el negocio marca su punto).
2. **Reseñas** se guardan como `publicado` al momento porque no hay panel de moderación (el diagrama pone `pendiente` por defecto).
3. **Publicar** pasa el negocio a `pending`; el directorio muestra `pending` y `verificado`. Cuando exista la verificación, un admin lo pasará a `verificado` (o `rechazado`).
4. **Pausar** no cambia `status`: usa `business_details.paused_at`, para no confundirlo con `suspendido` (acción de admin).
5. Los negocios de ejemplo no traen reseñas inventadas: su calificación es 0 hasta que alguien opine.

## Cómo se arma la respuesta de un negocio

La API sigue entregando el mismo objeto `Negocio` de antes (el front no cambió). `backend/src/base/negocio-vista.service.ts` lo arma así:

| Campo de la API | Sale de |
|---|---|
| `nombre`, `telefono`, `whatsapp`, `rfc`, `sitioWeb`, `descripcionCorta`, `imagenUrl` | `businesses.trade_name, phone_public, whatsapp, tax_id, website, short_description, cover_url` |
| `categoria`, `subcategoria` | `business_categories` + `categories` (slug de la principal, nombre de la sub) |
| `calle`, `colonia`, `ciudad`, `codigoPostal`, `direccion`, `latitud`, `longitud` | `business_addresses` |
| `horariosJson` | `business_hours` |
| `galeria` | `business_photos` |
| `descripcion`, `emailPublico`, `metodosPago`, `instruccionesPago`, `mostrarPagoPerfil`, `atiendeDomicilio`, `referencias`, `cobertura` | `business_details` |
| `estado` | `draft` → `en_proceso`; pausado / `suspendido` / `rechazado` → `pausado`; `pending` / `verificado` → `publicado` |
| `verificado` | `status = 'verificado'` |
| `calificacion`, `totalResenas` | promedio y conteo de `reviews` publicadas |
| `clicsWhatsapp`, `clicsLlamada` | conteo de `contact_events` |

Todos los `id` son **uuid** (texto).

## Comandos útiles (desde `backend/`)

```bash
npm run migracion:correr                                   # aplica migraciones pendientes (también pasa al arrancar)
npm run migracion:generar -- src/migraciones/NombreCambio  # tras cambiar una entidad, genera la migración
npm run typeorm -- migration:revert                        # deshace la última
```
