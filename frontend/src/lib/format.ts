import type { EstadoPedido } from "./types";

const moneda = new Intl.NumberFormat("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const entero = new Intl.NumberFormat("es-DO");

export const rd = (n: number) => `RD$ ${moneda.format(n)}`;
export const num = (n: number) => entero.format(n);

const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function fecha(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${meses[m - 1]} ${a}`;
}

export function fechaHora(iso: string): string {
  return `${fecha(iso)}, ${iso.slice(11, 16)}`;
}

export const etiquetaEstado: Record<EstadoPedido, string> = {
  ENVIADO: "Enviado",
  FACTURADO: "Facturado",
  EN_DESPACHO: "En camino",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}
