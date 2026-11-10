// Traducción de filas SQL (snake_case, 0/1) al modelo del dominio. Las columnas usan alias camelCase en los SELECT.
import type {
  Campana,
  Categoria,
  Comision,
  Existencia,
  ItemCatalogo,
  MovimientoInventario,
  NivelComision,
  PagoVendedora,
  Pedido,
  Producto,
  Usuario,
  Vendedora,
} from "../../domain/tipos";
import type { Fila } from "../db/base-datos";

const n = (x: unknown) => Number(x);
const nn = (x: unknown) => (x === null || x === undefined ? null : Number(x));
const bool = (x: unknown) => Number(x) === 1;
const s = (x: unknown) => String(x ?? "");
const sn = (x: unknown) => (x === null || x === undefined ? null : String(x));

export const COL = {
  usuario: "id, nombre, email, rol_id AS rolId, activo, ultimo_acceso AS ultimoAcceso",
  categoria: "id, nombre, descripcion, activa",
  producto: "id, sku, nombre, descripcion, categoria_id AS categoriaId, precio_base AS precioBase, activo, tono",
  campana: "id, codigo, nombre, numero, anio, fecha_inicio AS fechaInicio, fecha_fin AS fechaFin, estado",
  catalogo: "campana_id AS campanaId, producto_id AS productoId, pagina, precio, precio_oferta AS precioOferta, destacado",
  existencia: "producto_id AS productoId, existencia, reservado, minimo",
  movimiento: "id, producto_id AS productoId, tipo, cantidad, referencia, fecha",
  nivel: "id, nombre, minimo, maximo, porcentaje",
  vendedora: "id, usuario_id AS usuarioId, codigo, nombre, cedula, telefono, zona, fecha_ingreso AS fechaIngreso, estado",
  comision: "vendedora_id AS vendedoraId, campana_id AS campanaId, ventas, porcentaje, monto, estado",
  pago: "id, vendedora_id AS vendedoraId, fecha, monto, referencia",
  pedido: "id, numero, campana_id AS campanaId, vendedora_id AS vendedoraId, cliente, estado",
} as const;

export const aUsuario = (f: Fila): Usuario => ({
  id: n(f.id), nombre: s(f.nombre), email: s(f.email), rolId: n(f.rolId), activo: bool(f.activo), ultimoAcceso: sn(f.ultimoAcceso),
});
export const aCategoria = (f: Fila): Categoria => ({ id: n(f.id), nombre: s(f.nombre), descripcion: s(f.descripcion), activa: bool(f.activa) });
export const aProducto = (f: Fila): Producto => ({
  id: n(f.id), sku: s(f.sku), nombre: s(f.nombre), descripcion: s(f.descripcion), categoriaId: n(f.categoriaId),
  precioBase: n(f.precioBase), activo: bool(f.activo), tono: s(f.tono),
});
export const aCampana = (f: Fila): Campana => ({
  id: n(f.id), codigo: s(f.codigo), nombre: s(f.nombre), numero: n(f.numero), anio: n(f.anio),
  fechaInicio: s(f.fechaInicio), fechaFin: s(f.fechaFin), estado: s(f.estado) as Campana["estado"],
});
export const aItem = (f: Fila): ItemCatalogo => ({
  campanaId: n(f.campanaId), productoId: n(f.productoId), pagina: n(f.pagina), precio: n(f.precio),
  precioOferta: nn(f.precioOferta), destacado: bool(f.destacado),
});
export const aExistencia = (f: Fila): Existencia => ({
  productoId: n(f.productoId), existencia: n(f.existencia), reservado: n(f.reservado), minimo: n(f.minimo),
});
export const aMovimiento = (f: Fila): MovimientoInventario => ({
  id: n(f.id), productoId: n(f.productoId), tipo: s(f.tipo) as MovimientoInventario["tipo"], cantidad: n(f.cantidad),
  referencia: s(f.referencia), fecha: s(f.fecha),
});
export const aNivel = (f: Fila): NivelComision => ({
  id: n(f.id), nombre: s(f.nombre), minimo: n(f.minimo), maximo: nn(f.maximo), porcentaje: n(f.porcentaje),
});
export const aVendedora = (f: Fila): Vendedora => ({
  id: n(f.id), usuarioId: nn(f.usuarioId), codigo: s(f.codigo), nombre: s(f.nombre), cedula: s(f.cedula),
  telefono: s(f.telefono), zona: s(f.zona), fechaIngreso: s(f.fechaIngreso), estado: s(f.estado) as Vendedora["estado"],
});
export const aComision = (f: Fila): Comision => ({
  vendedoraId: n(f.vendedoraId), campanaId: n(f.campanaId), ventas: n(f.ventas), porcentaje: n(f.porcentaje),
  monto: n(f.monto), estado: s(f.estado) as Comision["estado"],
});
export const aPago = (f: Fila): PagoVendedora => ({
  id: n(f.id), vendedoraId: n(f.vendedoraId), fecha: s(f.fecha), monto: n(f.monto), referencia: s(f.referencia),
});

/** Arma pedidos completos a partir de las filas de pedido, detalle, historial, factura y despacho. */
export function armarPedidos(pedidos: Fila[], detalle: Fila[], historial: Fila[], facturas: Fila[], despachos: Fila[]): Pedido[] {
  const agrupar = (filas: Fila[]) => {
    const m = new Map<number, Fila[]>();
    for (const f of filas) m.set(n(f.pedidoId), [...(m.get(n(f.pedidoId)) ?? []), f]);
    return m;
  };
  const det = agrupar(detalle);
  const his = agrupar(historial);
  const fac = new Map(facturas.map((f) => [n(f.pedidoId), f]));
  const des = new Map(despachos.map((f) => [n(f.pedidoId), f]));

  return pedidos.map((p) => {
    const id = n(p.id);
    const f = fac.get(id);
    const d = des.get(id);
    return {
      id,
      numero: s(p.numero),
      campanaId: n(p.campanaId),
      vendedoraId: n(p.vendedoraId),
      cliente: s(p.cliente),
      estado: s(p.estado) as Pedido["estado"],
      lineas: (det.get(id) ?? []).map((l) => ({ productoId: n(l.productoId), cantidad: n(l.cantidad), precio: n(l.precio) })),
      historial: (his.get(id) ?? []).map((h) => {
        const nota = sn(h.nota);
        return nota ? { estado: s(h.estado) as Pedido["estado"], fecha: s(h.fecha), nota } : { estado: s(h.estado) as Pedido["estado"], fecha: s(h.fecha) };
      }),
      factura: f ? { numero: s(f.numero), fecha: s(f.fecha) } : null,
      despacho: d ? { mensajero: s(d.mensajero), guia: s(d.guia), salida: s(d.salida), entrega: sn(d.entrega) } : null,
    };
  });
}

/** SELECT de las piezas de un pedido, filtradas por una condición sobre la tabla pedido (alias p). */
export function consultasPedidos(condicion: string): string[] {
  const ids = `SELECT p.id FROM pedido p WHERE ${condicion}`;
  return [
    `SELECT ${COL.pedido} FROM pedido p WHERE ${condicion} ORDER BY p.fecha DESC, p.id DESC`,
    `SELECT pedido_id AS pedidoId, producto_id AS productoId, cantidad, precio FROM pedido_detalle WHERE pedido_id IN (${ids}) ORDER BY rowid`,
    `SELECT pedido_id AS pedidoId, estado, fecha, nota FROM pedido_historial WHERE pedido_id IN (${ids}) ORDER BY id`,
    `SELECT pedido_id AS pedidoId, numero, fecha FROM factura WHERE pedido_id IN (${ids})`,
    `SELECT pedido_id AS pedidoId, mensajero, guia, salida, entrega FROM despacho WHERE pedido_id IN (${ids})`,
  ];
}
