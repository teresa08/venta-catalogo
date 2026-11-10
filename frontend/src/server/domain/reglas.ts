// Reglas de cálculo puras. Las usan el backend y también las pantallas (vía lib/negocio).
import type { Comision, ItemCatalogo, LineaPedido, NivelComision } from "./tipos";

export const ITBIS = 0.18;

const redondear = (n: number) => Math.round(n * 100) / 100;

export function subtotalPedido(p: { lineas: LineaPedido[] }): number {
  return redondear(p.lineas.reduce((s, l) => s + l.cantidad * l.precio, 0));
}

/** El precio de oferta de la campaña tiene prioridad sobre el precio de catálogo. */
export function precioVigente(item: ItemCatalogo | undefined, precioBase: number): number {
  if (!item) return precioBase;
  return item.precioOferta ?? item.precio;
}

/** Nivel más alto cuyo mínimo alcanzan las ventas. */
export function nivelPara(niveles: NivelComision[], ventas: number): NivelComision {
  const ordenados = [...niveles].sort((a, b) => a.minimo - b.minimo);
  return [...ordenados].reverse().find((n) => ventas >= n.minimo) ?? ordenados[0];
}

/**
 * CU060: las ventas de la campaña son el subtotal sin ITBIS de los pedidos no cancelados.
 * Recibe los subtotales por pedido ya filtrados.
 */
export function calcularComisiones(
  campanaId: number,
  ventasPorPedido: { vendedoraId: number; subtotal: number }[],
  niveles: NivelComision[],
): Comision[] {
  const porVendedora = new Map<number, number>();
  for (const v of ventasPorPedido) porVendedora.set(v.vendedoraId, (porVendedora.get(v.vendedoraId) ?? 0) + v.subtotal);
  return [...porVendedora.entries()].map(([vendedoraId, ventas]) => {
    const nivel = nivelPara(niveles, ventas);
    return {
      vendedoraId,
      campanaId,
      ventas: redondear(ventas),
      porcentaje: nivel.porcentaje,
      monto: redondear((ventas * nivel.porcentaje) / 100),
      estado: "CALCULADA" as const,
    };
  });
}
