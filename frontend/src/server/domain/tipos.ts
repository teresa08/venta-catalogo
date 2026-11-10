export type RolCodigo = "ADMIN" | "VENDEDORA" | "CLIENTE";

export interface Rol {
  id: number;
  codigo: RolCodigo;
  nombre: string;
  permisos: string[];
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rolId: number;
  activo: boolean;
  ultimoAcceso: string | null;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  activa: boolean;
}

export interface Producto {
  id: number;
  sku: string;
  nombre: string;
  descripcion: string;
  categoriaId: number;
  precioBase: number;
  activo: boolean;
  tono: string; // color de la muestra en el catálogo
}

export type EstadoCampana = "BORRADOR" | "PUBLICADA" | "CERRADA";

export interface Campana {
  id: number;
  codigo: string;
  nombre: string;
  numero: number;
  anio: number;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoCampana;
}

export interface ItemCatalogo {
  campanaId: number;
  productoId: number;
  pagina: number;
  precio: number;
  precioOferta: number | null;
  destacado: boolean;
}

export interface Existencia {
  productoId: number;
  existencia: number;
  reservado: number;
  minimo: number;
}

export interface MovimientoInventario {
  id: number;
  productoId: number;
  tipo: "ENTRADA" | "SALIDA" | "AJUSTE" | "RESERVA";
  cantidad: number;
  referencia: string;
  fecha: string;
}

export interface NivelComision {
  id: number;
  nombre: string;
  minimo: number;
  maximo: number | null;
  porcentaje: number;
}

export interface Vendedora {
  id: number;
  usuarioId: number | null;
  codigo: string;
  nombre: string;
  cedula: string;
  telefono: string;
  zona: string;
  fechaIngreso: string;
  estado: "ACTIVA" | "SUSPENDIDA" | "INACTIVA";
}

export type EstadoPedido =
  | "ENVIADO"
  | "FACTURADO"
  | "EN_DESPACHO"
  | "ENTREGADO"
  | "CANCELADO";

export interface LineaPedido {
  productoId: number;
  cantidad: number;
  precio: number;
}

export interface CambioEstado {
  estado: EstadoPedido;
  fecha: string;
  nota?: string;
}

export interface Pedido {
  id: number;
  numero: string;
  campanaId: number;
  vendedoraId: number;
  cliente: string;
  lineas: LineaPedido[];
  estado: EstadoPedido;
  historial: CambioEstado[];
  factura: { numero: string; fecha: string } | null;
  despacho: { mensajero: string; guia: string; salida: string; entrega: string | null } | null;
}

export interface Comision {
  vendedoraId: number;
  campanaId: number;
  ventas: number;
  porcentaje: number;
  monto: number;
  estado: "CALCULADA" | "APROBADA" | "PAGADA";
}

export interface PagoVendedora {
  id: number;
  vendedoraId: number;
  fecha: string;
  monto: number;
  referencia: string;
}

export interface LineaCarrito {
  productoId: number;
  cantidad: number;
}
