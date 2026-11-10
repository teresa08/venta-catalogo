// Reglas de cálculo que también usan las pantallas. La fuente es el dominio del backend.
export { ITBIS, nivelPara, subtotalPedido } from "@/server/domain/reglas";

export const permisosDescritos: Record<string, string> = {
  "usuarios.gestionar": "Crear usuarios y asignar roles",
  "catalogo.gestionar": "Administrar categorías y productos",
  "campanas.publicar": "Crear y publicar campañas",
  "pedidos.facturar": "Facturar pedidos",
  "pedidos.despachar": "Despachar y confirmar entregas",
  "inventario.gestionar": "Registrar entradas y ajustes de inventario",
  "vendedoras.gestionar": "Registrar y administrar vendedoras",
  "comisiones.calcular": "Calcular y aprobar comisiones",
  "reportes.ver": "Ver y descargar reportes de ventas",
  "catalogo.consultar": "Consultar el catálogo vigente",
  "pedidos.registrar": "Registrar y enviar pedidos",
  "pedidos.consultar": "Consultar el estado de sus pedidos",
  "cuenta.consultar": "Consultar su estado de cuenta",
};

/** Fecha de hoy en Santo Domingo, AAAA-MM-DD. */
export function hoy(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Santo_Domingo" }).format(new Date());
}
