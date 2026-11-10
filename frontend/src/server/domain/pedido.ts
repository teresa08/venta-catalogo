// Agregado Pedido: controla el ciclo de vida ENVIADO → FACTURADO → EN_DESPACHO → ENTREGADO (o CANCELADO).
import { exigir, ReglaDeNegocioError } from "./errores";
import { subtotalPedido } from "./reglas";
import type { CambioEstado, EstadoPedido, LineaPedido, Pedido as PedidoDatos } from "./tipos";

const TRANSICIONES: Record<EstadoPedido, EstadoPedido[]> = {
  ENVIADO: ["FACTURADO", "CANCELADO"],
  FACTURADO: ["EN_DESPACHO", "CANCELADO"],
  EN_DESPACHO: ["ENTREGADO"],
  ENTREGADO: [],
  CANCELADO: [],
};

export class Pedido {
  private readonly datos: PedidoDatos;
  /** Cambios de estado aún no guardados. El repositorio los lee al persistir. */
  private readonly nuevos: CambioEstado[] = [];

  private constructor(datos: PedidoDatos) {
    this.datos = structuredClone(datos);
  }

  static reconstruir(datos: PedidoDatos): Pedido {
    return new Pedido(datos);
  }

  /** CU045: crea el pedido con las líneas del carrito y los precios vigentes. */
  static crear(p: { numero: string; campanaId: number; vendedoraId: number; cliente: string; lineas: LineaPedido[]; fecha: string }): Pedido {
    exigir(p.lineas.length > 0, "El pedido no tiene productos");
    const ids = new Set(p.lineas.map((l) => l.productoId));
    exigir(ids.size === p.lineas.length, "Un producto aparece dos veces en el pedido");
    for (const l of p.lineas) {
      exigir(Number.isInteger(l.cantidad) && l.cantidad > 0, "Las cantidades deben ser enteros mayores que cero");
      exigir(l.precio > 0, "Todos los productos deben tener precio");
    }
    const pedido = new Pedido({
      id: 0,
      numero: p.numero,
      campanaId: p.campanaId,
      vendedoraId: p.vendedoraId,
      cliente: p.cliente.trim() || "Sin nombre",
      lineas: p.lineas,
      estado: "ENVIADO",
      historial: [],
      factura: null,
      despacho: null,
    });
    pedido.registrar("ENVIADO", p.fecha);
    return pedido;
  }

  get id() { return this.datos.id; }
  get numero() { return this.datos.numero; }
  get estado() { return this.datos.estado; }
  get vendedoraId() { return this.datos.vendedoraId; }
  get lineas(): readonly LineaPedido[] { return this.datos.lineas; }
  get factura() { return this.datos.factura; }
  get despacho() { return this.datos.despacho; }
  get subtotal() { return subtotalPedido(this.datos); }
  get cambiosPendientes(): readonly CambioEstado[] { return this.nuevos; }

  /** Consecutivo numérico del pedido (PED-2026-000153 → 153). */
  get consecutivo(): number {
    return Number(this.datos.numero.slice(-6));
  }

  /** CU075 */
  facturar(fecha: string): void {
    this.transicionar("FACTURADO", fecha);
    this.datos.factura = { numero: this.datos.numero.replace("PED", "FAC"), fecha };
  }

  /** CU080: la mercancía sale con el mensajero. */
  despachar(mensajero: string, fecha: string): void {
    exigir(mensajero.trim(), "Indica el mensajero que lleva el pedido");
    this.transicionar("EN_DESPACHO", fecha);
    this.datos.despacho = { mensajero: mensajero.trim(), guia: `GD-${5000 + this.consecutivo}`, salida: fecha, entrega: null };
  }

  /** CU080 */
  confirmarEntrega(fecha: string): void {
    this.transicionar("ENTREGADO", fecha);
    this.datos.despacho = { ...this.datos.despacho!, entrega: fecha };
  }

  cancelar(motivo: string, fecha: string): void {
    exigir(motivo.trim(), "Indica el motivo de la cancelación");
    this.transicionar("CANCELADO", fecha, motivo.trim());
  }

  aDatos(): PedidoDatos {
    return structuredClone(this.datos);
  }

  private transicionar(destino: EstadoPedido, fecha: string, nota?: string): void {
    if (!TRANSICIONES[this.datos.estado].includes(destino)) {
      throw new ReglaDeNegocioError(`Un pedido en estado ${this.datos.estado} no puede pasar a ${destino}`);
    }
    this.registrar(destino, fecha, nota);
  }

  private registrar(estado: EstadoPedido, fecha: string, nota?: string): void {
    const cambio: CambioEstado = nota ? { estado, fecha, nota } : { estado, fecha };
    this.datos.estado = estado;
    this.datos.historial.push(cambio);
    this.nuevos.push(cambio);
  }
}
