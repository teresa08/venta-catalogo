// Genera database/d1/migrations/0002_datos_demo.sql a partir de datos-demo.ts.
// Uso (Node 22.18+):  node database/d1/semilla/generar-datos.ts
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as d from "./datos-demo.ts";

const CLAVE_DEMO = "Demo2026!";
const ITERACIONES = 100_000;

// Mismo formato que Pbkdf2PasswordHasher en el backend.
function hash(clave: string): string {
  const sal = randomBytes(16);
  const h = pbkdf2Sync(clave, sal, ITERACIONES, 32, "sha256");
  return `pbkdf2_sha256$${ITERACIONES}$${sal.toString("base64")}$${h.toString("base64")}`;
}

const v = (x: unknown): string => {
  if (x === null || x === undefined) return "NULL";
  if (typeof x === "boolean") return x ? "1" : "0";
  if (typeof x === "number") return String(x);
  return `'${String(x).replace(/'/g, "''")}'`;
};
const fila = (...xs: unknown[]) => `(${xs.map(v).join(", ")})`;
const insert = (tabla: string, columnas: string, filas: string[]) =>
  filas.length ? `INSERT INTO ${tabla} (${columnas}) VALUES\n  ${filas.join(",\n  ")};\n` : "";

const sql: string[] = [
  "-- Datos de demostración. Generado por database/d1/semilla/generar-datos.ts: no editar a mano.",
  `-- Todos los usuarios entran con la contraseña ${CLAVE_DEMO}`,
  "",
];

sql.push(insert("rol", "id, codigo, nombre", d.roles.map((r) => fila(r.id, r.codigo, r.nombre))));
sql.push(insert("permiso", "codigo, descripcion", Object.entries(d.permisosDescritos).map(([c, t]) => fila(c, t))));
sql.push(insert("rol_permiso", "rol_id, permiso", d.roles.flatMap((r) => r.permisos.map((p) => fila(r.id, p)))));
sql.push(
  insert(
    "usuario",
    "id, nombre, email, clave_hash, rol_id, activo, ultimo_acceso",
    d.usuarios.map((u) => fila(u.id, u.nombre, u.email, hash(CLAVE_DEMO), u.rolId, u.activo, u.ultimoAcceso)),
  ),
);
sql.push(insert("categoria", "id, nombre, descripcion, activa", d.categorias.map((c) => fila(c.id, c.nombre, c.descripcion, c.activa))));
sql.push(
  insert(
    "producto",
    "id, sku, nombre, descripcion, categoria_id, precio_base, activo, tono",
    d.productos.map((p) => fila(p.id, p.sku, p.nombre, p.descripcion, p.categoriaId, p.precioBase, p.activo, p.tono)),
  ),
);
sql.push(
  insert(
    "campana",
    "id, codigo, nombre, numero, anio, fecha_inicio, fecha_fin, estado",
    d.campanas.map((c) => fila(c.id, c.codigo, c.nombre, c.numero, c.anio, c.fechaInicio, c.fechaFin, c.estado)),
  ),
);
sql.push(
  insert(
    "catalogo_item",
    "campana_id, producto_id, pagina, precio, precio_oferta, destacado",
    d.catalogo.map((i) => fila(i.campanaId, i.productoId, i.pagina, i.precio, i.precioOferta, i.destacado)),
  ),
);
sql.push(
  insert("inventario", "producto_id, existencia, reservado, minimo", d.existencias.map((e) => fila(e.productoId, e.existencia, e.reservado, e.minimo))),
);
sql.push(
  insert(
    "movimiento_inventario",
    "id, producto_id, tipo, cantidad, referencia, fecha",
    d.movimientos.map((m) => fila(m.id, m.productoId, m.tipo, m.cantidad, m.referencia, m.fecha)),
  ),
);
sql.push(
  insert("nivel_comision", "id, nombre, minimo, maximo, porcentaje", d.nivelesComision.map((n) => fila(n.id, n.nombre, n.minimo, n.maximo, n.porcentaje))),
);
sql.push(
  insert(
    "vendedora",
    "id, usuario_id, codigo, nombre, cedula, telefono, zona, fecha_ingreso, estado",
    d.vendedoras.map((x) => fila(x.id, x.usuarioId, x.codigo, x.nombre, x.cedula, x.telefono, x.zona, x.fechaIngreso, x.estado)),
  ),
);
sql.push(
  insert(
    "pedido",
    "id, numero, campana_id, vendedora_id, cliente, estado, fecha",
    d.pedidos.map((p) => fila(p.id, p.numero, p.campanaId, p.vendedoraId, p.cliente, p.estado, p.historial[0].fecha)),
  ),
);
sql.push(
  insert(
    "pedido_detalle",
    "pedido_id, producto_id, cantidad, precio",
    d.pedidos.flatMap((p) => p.lineas.map((l) => fila(p.id, l.productoId, l.cantidad, l.precio))),
  ),
);
sql.push(
  insert(
    "pedido_historial",
    "pedido_id, estado, fecha, nota",
    d.pedidos.flatMap((p) => p.historial.map((h) => fila(p.id, h.estado, h.fecha, h.nota ?? null))),
  ),
);
sql.push(
  insert(
    "factura",
    "pedido_id, numero, fecha",
    d.pedidos.filter((p) => p.factura).map((p) => fila(p.id, p.factura!.numero, p.factura!.fecha)),
  ),
);
sql.push(
  insert(
    "despacho",
    "pedido_id, mensajero, guia, salida, entrega",
    d.pedidos.filter((p) => p.despacho).map((p) => fila(p.id, p.despacho!.mensajero, p.despacho!.guia, p.despacho!.salida, p.despacho!.entrega)),
  ),
);
sql.push(
  insert(
    "comision",
    "vendedora_id, campana_id, ventas, porcentaje, monto, estado",
    d.comisionesIniciales.map((c) => fila(c.vendedoraId, c.campanaId, c.ventas, c.porcentaje, c.monto, c.estado)),
  ),
);
sql.push(
  insert("pago_vendedora", "id, vendedora_id, fecha, monto, referencia", d.pagosVendedoras.map((p) => fila(p.id, p.vendedoraId, p.fecha, p.monto, p.referencia))),
);

const destino = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations", "0002_datos_demo.sql");
writeFileSync(destino, sql.join("\n"), "utf8");
console.log(`Escrito ${destino}`);
