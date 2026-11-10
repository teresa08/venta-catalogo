# Sistema de Venta por Catálogo

Proyecto del Grupo 5, Ingeniería de Software I (UASD, 2026).

```
frontend/                  Next.js 15: interfaz (React 19) y API (Route Handlers en src/app/api)
  src/server/              Backend con arquitectura hexagonal
database/d1/               Base de datos Cloudflare D1 (SQLite): migraciones, datos demo y wrangler.toml
database/venta_catalogo.sql  Script original para PostgreSQL (referencia del diseño)
netlify.toml               Despliegue en Netlify
.github/workflows/         CI (tipos, pruebas, build) y migraciones de D1
```

## Arquitectura

```
          Navegador (React)                     Netlify (funciones de Next.js)                 Cloudflare
 ┌──────────────────────────┐   fetch /api   ┌────────────────────────────────────────┐  HTTPS  ┌──────────┐
 │ páginas → lib/store.tsx  │ ─────────────► │ http/ (adaptador de entrada: rutas,    │ ──────► │  D1      │
 │          → lib/api.ts    │   JWT Bearer   │        zod, errores → HTTP)            │  REST   │ (SQLite) │
 └──────────────────────────┘                │ application/ (casos de uso + puertos)  │         └──────────┘
                                             │ domain/ (Pedido, Existencia, Campaña,  │
                                             │          reglas de comisión e ITBIS)   │
                                             │ infrastructure/ (repositorios SQL, D1, │
                                             │   SQLite local, JWT, PBKDF2, reloj)    │
                                             └────────────────────────────────────────┘
```

`frontend/src/server/` sigue puertos y adaptadores:

| Capa | Carpeta | Qué contiene | Depende de |
|---|---|---|---|
| Dominio | `domain/` | Entidades con sus reglas (`Pedido` con su máquina de estados, `Existencia`, `Campana`), cálculos puros (`reglas.ts`) y errores | nada |
| Aplicación | `application/` | Un caso de uso por clase (`EnviarPedido`, `PublicarCampana`…), puertos (`puertos.ts`) y permisos | dominio |
| Infraestructura | `infrastructure/` | Adaptadores de salida: repositorios SQL, `D1HttpBaseDatos`, `SqliteLocalBaseDatos`, `Transaccion` (unidad de trabajo), JWT, PBKDF2 | aplicación |
| Entrada HTTP | `http/` y `src/app/api/` | Rutas REST, validación con zod, traducción de errores a 400/401/403/404/409/422 | aplicación |
| Composición | `contenedor.ts` | Único lugar que crea las implementaciones concretas | todo |

Principios SOLID aplicados:

- **S**: cada caso de uso es una clase con una sola responsabilidad; los repositorios solo persisten, las rutas solo traducen HTTP.
- **O**: cambiar de D1 a SQLite (o a otro motor) es agregar un adaptador de `BaseDatos`, sin tocar casos de uso.
- **L**: `D1HttpBaseDatos` y `SqliteLocalBaseDatos` son intercambiables; las pruebas del API corren con cualquiera.
- **I**: un puerto por necesidad (`PedidoRepositorio`, `Reloj`, `CifradorClaves`, `EmisorTokens`…), no un repositorio genérico.
- **D**: los casos de uso reciben interfaces por constructor; `contenedor.ts` inyecta las implementaciones.

Cada caso de uso confirma sus escrituras en **un solo lote** (`Transaccion`), así un pedido, sus líneas, su historial y la reserva de inventario se guardan juntos.

## API

Todas las rutas responden JSON; los errores tienen la forma `{ "error": "mensaje" }`.

| Método y ruta | Caso de uso | Permiso |
|---|---|---|
| `POST /api/auth/login` | CU010 iniciar sesión → `{ token, usuario }` | público |
| `GET /api/estado` | Datos visibles para la sesión (sin sesión: catálogo público) | público / sesión |
| `POST /api/usuarios`, `PUT /api/usuarios/:id` | CU015 | `usuarios.gestionar` |
| `POST /api/categorias`, `PUT /api/categorias/:id` | CU020 | `catalogo.gestionar` |
| `POST /api/productos`, `PUT /api/productos/:id` | CU025 | `catalogo.gestionar` |
| `POST /api/campanas/:id/publicar` y `/cerrar` | CU030 | `campanas.publicar` |
| `POST /api/pedidos` | CU045 enviar pedido (reserva existencias) | `pedidos.registrar` |
| `POST /api/pedidos/:id/facturar` | CU075 | `pedidos.facturar` |
| `POST /api/pedidos/:id/despachar` `{ dato: mensajero }` | CU080 (sale del inventario) | `pedidos.despachar` |
| `POST /api/pedidos/:id/entregar` | CU080 | `pedidos.despachar` |
| `POST /api/pedidos/:id/cancelar` `{ dato: motivo }` | libera existencias | `pedidos.facturar` |
| `POST /api/inventario/movimientos` | CU070 entrada o ajuste | `inventario.gestionar` |
| `POST /api/vendedoras`, `PUT /api/vendedoras/:id` | CU055 | `vendedoras.gestionar` |
| `POST /api/campanas/:id/comisiones` y `/aprobar` | CU060 | `comisiones.calcular` |

## Desarrollo local

Requiere Node 22.5 o superior.

```bash
cd frontend
npm install
npm run dev
```

Sin variables de Cloudflare, el API crea `frontend/.data/venta-catalogo.db` con las migraciones de `database/d1/migrations`. Para empezar de cero, borra esa carpeta.

Usuarios de demostración (contraseña `Demo2026!`): `ncastillo@ventacatalogo.do` (administración) y `yokasta.pena@gmail.com` (vendedora). La pantalla de inicio tiene botones para entrar con ellos.

```bash
npm test             # pruebas del dominio (vitest)
npm run lint:tipos   # TypeScript
```

Si cambias `database/d1/semilla/datos-demo.ts`, regenera el SQL de datos con `node database/d1/semilla/generar-datos.ts` (desde la raíz del repositorio).

## Despliegue

### 1. Base de datos en Cloudflare D1

```bash
cd database/d1
npx wrangler login
npx wrangler d1 create venta-catalogo
```

Copia el `database_id` que imprime en `database/d1/wrangler.toml` y aplica las migraciones:

```bash
npx wrangler d1 migrations apply venta-catalogo --remote
npx wrangler d1 execute venta-catalogo --remote --command "SELECT COUNT(*) FROM pedido"
```

Crea un token en Cloudflare (My Profile → API Tokens → Create Token → Custom token) con el permiso **Account → D1 → Edit**. Anota también tu **Account ID** (aparece en el panel de Workers & Pages).

### 2. Repositorio en GitHub

Crea un repositorio vacío en GitHub y sube el proyecto:

```bash
git remote add origin https://github.com/TU_USUARIO/venta-catalogo.git
git push -u origin main
```

Para que GitHub aplique solas las migraciones nuevas, agrega los secretos `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` en Settings → Secrets and variables → Actions.

### 3. Sitio en Netlify

1. Netlify → Add new project → Import an existing project → GitHub → elige el repositorio. `netlify.toml` ya define la carpeta `frontend`, el comando y Node 22.
2. Antes de desplegar, en Site configuration → Environment variables agrega `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`, `CLOUDFLARE_API_TOKEN` y `JWT_SECRET` (genera uno con `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`).
3. Deploy. Cada `git push` a `main` vuelve a desplegar.

## Casos de uso y pantallas

| Caso de uso | Pantalla |
|---|---|
| CU010 Registrar y autenticar usuario | `/` |
| CU015 Administrar roles y permisos | `/admin/usuarios` |
| CU020 Administrar categorías | `/admin/categorias` |
| CU025 Administrar productos | `/admin/productos` |
| CU030 Publicar catálogo de campaña | `/admin/campanas` |
| CU035 Consultar catálogo y buscar productos | `/vendedora` |
| CU040 Registrar pedido en el carrito | `/vendedora` y `/vendedora/carrito` |
| CU045 Confirmar y enviar pedido | `/vendedora/carrito` |
| CU050 Consultar estado del pedido | `/vendedora/pedidos` |
| CU055 Registrar y administrar vendedoras | `/admin/vendedoras` |
| CU060 Calcular comisiones de la campaña | `/admin/comisiones` |
| CU065 Consultar estado de cuenta | `/vendedora/cuenta` |
| CU070 Controlar existencias | `/admin/inventario` |
| CU075 Facturar pedido | `/admin/pedidos` |
| CU080 Despachar y confirmar entrega | `/admin/pedidos` |
| CU085 Generar reportes de ventas | `/admin/reportes` |
