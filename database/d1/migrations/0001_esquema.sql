-- =============================================================================
-- Sistema de Venta por Catálogo: esquema para Cloudflare D1 (SQLite)
-- Las reglas de negocio que en PostgreSQL vivían en funciones y disparadores
-- ahora viven en la capa de dominio del backend (frontend/src/server/domain).
-- Aquí quedan las claves, restricciones CHECK e índices como red de seguridad.
-- Fechas: texto ISO 8601 en hora local de Santo Domingo ("2026-10-21T08:12:00").
-- =============================================================================

-- D1 aplica las claves foráneas por defecto; el adaptador SQLite local las activa al abrir.

-- Seguridad (CU010, CU015) ----------------------------------------------------
CREATE TABLE rol (
  id      INTEGER PRIMARY KEY,
  codigo  TEXT NOT NULL UNIQUE CHECK (codigo IN ('ADMIN', 'VENDEDORA', 'CLIENTE')),
  nombre  TEXT NOT NULL
);

CREATE TABLE permiso (
  codigo       TEXT PRIMARY KEY,
  descripcion  TEXT NOT NULL
);

CREATE TABLE rol_permiso (
  rol_id   INTEGER NOT NULL REFERENCES rol(id) ON DELETE CASCADE,
  permiso  TEXT    NOT NULL REFERENCES permiso(codigo) ON DELETE CASCADE,
  PRIMARY KEY (rol_id, permiso)
);

CREATE TABLE usuario (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre         TEXT    NOT NULL CHECK (length(trim(nombre)) > 0),
  email          TEXT    NOT NULL UNIQUE COLLATE NOCASE CHECK (email LIKE '%_@_%._%'),
  clave_hash     TEXT    NOT NULL,
  rol_id         INTEGER NOT NULL REFERENCES rol(id),
  activo         INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  ultimo_acceso  TEXT
);

-- Catálogo (CU020, CU025, CU030) ----------------------------------------------
CREATE TABLE categoria (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  descripcion  TEXT    NOT NULL DEFAULT '',
  activa       INTEGER NOT NULL DEFAULT 1 CHECK (activa IN (0, 1))
);

CREATE TABLE producto (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  sku           TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  nombre        TEXT    NOT NULL,
  descripcion   TEXT    NOT NULL DEFAULT '',
  categoria_id  INTEGER NOT NULL REFERENCES categoria(id),
  precio_base   REAL    NOT NULL CHECK (precio_base > 0),
  activo        INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  tono          TEXT    NOT NULL DEFAULT '#CCCCCC'
);
CREATE INDEX ix_producto_categoria ON producto(categoria_id);

CREATE TABLE campana (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo        TEXT    NOT NULL UNIQUE,
  nombre        TEXT    NOT NULL,
  numero        INTEGER NOT NULL CHECK (numero BETWEEN 1 AND 18),
  anio          INTEGER NOT NULL,
  fecha_inicio  TEXT    NOT NULL,
  fecha_fin     TEXT    NOT NULL,
  estado        TEXT    NOT NULL DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR', 'PUBLICADA', 'CERRADA')),
  CHECK (fecha_fin > fecha_inicio)
);
-- Solo una campaña publicada a la vez.
CREATE UNIQUE INDEX ux_campana_publicada ON campana(estado) WHERE estado = 'PUBLICADA';

CREATE TABLE catalogo_item (
  campana_id     INTEGER NOT NULL REFERENCES campana(id) ON DELETE CASCADE,
  producto_id    INTEGER NOT NULL REFERENCES producto(id),
  pagina         INTEGER NOT NULL CHECK (pagina > 0),
  precio         REAL    NOT NULL CHECK (precio > 0),
  precio_oferta  REAL    CHECK (precio_oferta IS NULL OR precio_oferta > 0),
  destacado      INTEGER NOT NULL DEFAULT 0 CHECK (destacado IN (0, 1)),
  PRIMARY KEY (campana_id, producto_id)
);

-- Inventario (CU070) ----------------------------------------------------------
CREATE TABLE inventario (
  producto_id  INTEGER PRIMARY KEY REFERENCES producto(id) ON DELETE CASCADE,
  existencia   INTEGER NOT NULL DEFAULT 0  CHECK (existencia >= 0),
  reservado    INTEGER NOT NULL DEFAULT 0  CHECK (reservado >= 0),
  minimo       INTEGER NOT NULL DEFAULT 10 CHECK (minimo >= 0),
  CHECK (reservado <= existencia)
);

CREATE TABLE movimiento_inventario (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id  INTEGER NOT NULL REFERENCES producto(id),
  tipo         TEXT    NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA', 'AJUSTE', 'RESERVA')),
  cantidad     INTEGER NOT NULL CHECK (cantidad <> 0),
  referencia   TEXT    NOT NULL,
  fecha        TEXT    NOT NULL
);
CREATE INDEX ix_movimiento_producto ON movimiento_inventario(producto_id, fecha);

-- Red de vendedoras y comisiones (CU055, CU060) -------------------------------
CREATE TABLE nivel_comision (
  id          INTEGER PRIMARY KEY,
  nombre      TEXT NOT NULL,
  minimo      REAL NOT NULL CHECK (minimo >= 0),
  maximo      REAL,
  porcentaje  REAL NOT NULL CHECK (porcentaje > 0 AND porcentaje < 100)
);

CREATE TABLE vendedora (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id     INTEGER UNIQUE REFERENCES usuario(id) ON DELETE SET NULL,
  codigo         TEXT    NOT NULL UNIQUE,
  nombre         TEXT    NOT NULL,
  cedula         TEXT    NOT NULL UNIQUE,
  telefono       TEXT    NOT NULL,
  zona           TEXT    NOT NULL,
  fecha_ingreso  TEXT    NOT NULL,
  estado         TEXT    NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'SUSPENDIDA', 'INACTIVA'))
);

-- Pedidos, facturación y despacho (CU040–CU080) -------------------------------
CREATE TABLE pedido (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  numero        TEXT    NOT NULL UNIQUE,
  campana_id    INTEGER NOT NULL REFERENCES campana(id),
  vendedora_id  INTEGER NOT NULL REFERENCES vendedora(id),
  cliente       TEXT    NOT NULL,
  estado        TEXT    NOT NULL CHECK (estado IN ('ENVIADO', 'FACTURADO', 'EN_DESPACHO', 'ENTREGADO', 'CANCELADO')),
  fecha         TEXT    NOT NULL
);
CREATE INDEX ix_pedido_vendedora ON pedido(vendedora_id);
CREATE INDEX ix_pedido_campana ON pedido(campana_id, estado);

CREATE TABLE pedido_detalle (
  pedido_id    INTEGER NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
  producto_id  INTEGER NOT NULL REFERENCES producto(id),
  cantidad     INTEGER NOT NULL CHECK (cantidad > 0),
  precio       REAL    NOT NULL CHECK (precio > 0),
  PRIMARY KEY (pedido_id, producto_id)
);

CREATE TABLE pedido_historial (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id  INTEGER NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
  estado     TEXT    NOT NULL,
  fecha      TEXT    NOT NULL,
  nota       TEXT
);
CREATE INDEX ix_historial_pedido ON pedido_historial(pedido_id);

CREATE TABLE factura (
  pedido_id  INTEGER PRIMARY KEY REFERENCES pedido(id) ON DELETE CASCADE,
  numero     TEXT    NOT NULL UNIQUE,
  fecha      TEXT    NOT NULL
);

CREATE TABLE despacho (
  pedido_id  INTEGER PRIMARY KEY REFERENCES pedido(id) ON DELETE CASCADE,
  mensajero  TEXT    NOT NULL,
  guia       TEXT    NOT NULL UNIQUE,
  salida     TEXT    NOT NULL,
  entrega    TEXT
);

CREATE TABLE comision (
  vendedora_id  INTEGER NOT NULL REFERENCES vendedora(id),
  campana_id    INTEGER NOT NULL REFERENCES campana(id),
  ventas        REAL    NOT NULL CHECK (ventas >= 0),
  porcentaje    REAL    NOT NULL,
  monto         REAL    NOT NULL CHECK (monto >= 0),
  estado        TEXT    NOT NULL CHECK (estado IN ('CALCULADA', 'APROBADA', 'PAGADA')),
  PRIMARY KEY (vendedora_id, campana_id)
);

CREATE TABLE pago_vendedora (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  vendedora_id  INTEGER NOT NULL REFERENCES vendedora(id),
  fecha         TEXT    NOT NULL,
  monto         REAL    NOT NULL CHECK (monto > 0),
  referencia    TEXT    NOT NULL
);
CREATE INDEX ix_pago_vendedora ON pago_vendedora(vendedora_id);
