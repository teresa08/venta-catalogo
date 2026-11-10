// CU045 enviar pedido, CU075 facturar, CU080 despachar y confirmar entrega, cancelar. CU070 movimientos.
import type { Existencia } from "../../domain/inventario";
import { exigir, NoEncontradoError, ReglaDeNegocioError } from "../../domain/errores";
import { Pedido } from "../../domain/pedido";
import { precioVigente } from "../../domain/reglas";
import type { LineaCarrito } from "../../domain/tipos";
import { exigirPermiso, type Permiso } from "../autorizacion";
import type {
  CampanaRepositorio,
  InventarioRepositorio,
  PedidoRepositorio,
  ProductoRepositorio,
  Reloj,
  Sesion,
  UnidadDeTrabajo,
  VendedoraRepositorio,
} from "../puertos";

export class EnviarPedido {
  constructor(
    private readonly pedidos: PedidoRepositorio,
    private readonly campanas: CampanaRepositorio,
    private readonly productos: ProductoRepositorio,
    private readonly vendedoras: VendedoraRepositorio,
    private readonly inventario: InventarioRepositorio,
    private readonly reloj: Reloj,
    private readonly uow: UnidadDeTrabajo,
  ) {}

  /** Devuelve el número del pedido creado. */
  async ejecutar(sesion: Sesion | null, cliente: string, carrito: LineaCarrito[]): Promise<string> {
    const s = exigirPermiso(sesion, "pedidos.registrar");
    if (s.vendedoraId === null) throw new ReglaDeNegocioError("Tu usuario no está asociado a una vendedora");
    const vendedora = await this.vendedoras.porId(s.vendedoraId);
    exigir(vendedora?.estado === "ACTIVA", "Tu cuenta de vendedora no está activa");

    const campana = await this.campanas.publicada();
    exigir(campana, "No hay una campaña publicada");
    const items = await this.campanas.itemsCatalogo(campana.id);

    const ids = carrito.map((l) => l.productoId);
    const productos = await this.productos.porIds(ids);
    const existencias = new Map((await this.inventario.porProductos(ids)).map((e) => [e.productoId, e]));

    const lineas = carrito.map((l) => {
      const producto = productos.find((p) => p.id === l.productoId);
      const item = items.find((i) => i.productoId === l.productoId);
      exigir(producto?.activo && item, `El producto ${l.productoId} no está en el catálogo de la campaña`);
      return { productoId: l.productoId, cantidad: l.cantidad, precio: precioVigente(item, producto.precioBase), nombre: producto.nombre };
    });

    const fecha = this.reloj.ahora();
    const anio = Number(fecha.slice(0, 4));
    const consecutivo = (await this.pedidos.ultimoConsecutivo(anio)) + 1;
    const numero = `PED-${anio}-${String(consecutivo).padStart(6, "0")}`;

    const pedido = Pedido.crear({
      numero,
      campanaId: campana.id,
      vendedoraId: s.vendedoraId,
      cliente,
      lineas: lineas.map(({ nombre: _, ...l }) => l),
      fecha,
    });

    for (const l of lineas) {
      const e = existencias.get(l.productoId);
      exigir(e, `${l.nombre} no tiene inventario`);
      e.reservar(l.cantidad, l.nombre);
      this.inventario.guardar(e);
      this.inventario.registrarMovimiento({ productoId: l.productoId, tipo: "RESERVA", cantidad: l.cantidad, referencia: `Pedido ${numero}`, fecha });
    }
    this.pedidos.agregar(pedido);
    await this.uow.confirmar();
    return numero;
  }
}

export type AccionPedido = "facturar" | "despachar" | "entregar" | "cancelar";

const PERMISO_ACCION: Record<AccionPedido, Permiso> = {
  facturar: "pedidos.facturar",
  despachar: "pedidos.despachar",
  entregar: "pedidos.despachar",
  cancelar: "pedidos.facturar",
};

/** Avanza el pedido por su ciclo de vida y mueve el inventario que corresponde. */
export class CambiarEstadoPedido {
  constructor(
    private readonly pedidos: PedidoRepositorio,
    private readonly inventario: InventarioRepositorio,
    private readonly reloj: Reloj,
    private readonly uow: UnidadDeTrabajo,
  ) {}

  async ejecutar(sesion: Sesion | null, pedidoId: number, accion: AccionPedido, dato = ""): Promise<void> {
    exigirPermiso(sesion, PERMISO_ACCION[accion]);
    const pedido = await this.pedidos.porId(pedidoId);
    if (!pedido) throw new NoEncontradoError("El pedido");
    const fecha = this.reloj.ahora();

    switch (accion) {
      case "facturar":
        pedido.facturar(fecha);
        break;
      case "despachar":
        pedido.despachar(dato, fecha);
        await this.moverInventario(pedido, (e, cantidad) => e.despachar(cantidad), (productoId, cantidad) =>
          this.inventario.registrarMovimiento({ productoId, tipo: "SALIDA", cantidad, referencia: `Despacho ${pedido.numero}`, fecha }),
        );
        break;
      case "entregar":
        pedido.confirmarEntrega(fecha);
        break;
      case "cancelar":
        pedido.cancelar(dato, fecha);
        await this.moverInventario(pedido, (e, cantidad) => e.liberar(cantidad));
        break;
    }
    this.pedidos.guardar(pedido);
    await this.uow.confirmar();
  }

  private async moverInventario(
    pedido: Pedido,
    cambio: (e: Existencia, cantidad: number) => void,
    registrar?: (productoId: number, cantidad: number) => void,
  ): Promise<void> {
    const existencias = await this.inventario.porProductos(pedido.lineas.map((l) => l.productoId));
    for (const l of pedido.lineas) {
      const e = existencias.find((x) => x.productoId === l.productoId);
      if (!e) continue;
      cambio(e, l.cantidad);
      this.inventario.guardar(e);
      registrar?.(l.productoId, l.cantidad);
    }
  }
}

export class RegistrarMovimiento {
  constructor(
    private readonly inventario: InventarioRepositorio,
    private readonly productos: ProductoRepositorio,
    private readonly reloj: Reloj,
    private readonly uow: UnidadDeTrabajo,
  ) {}

  async ejecutar(sesion: Sesion | null, m: { productoId: number; tipo: "ENTRADA" | "AJUSTE"; cantidad: number; referencia: string }): Promise<void> {
    exigirPermiso(sesion, "inventario.gestionar");
    exigir(m.referencia.trim(), "Indica la referencia del movimiento");
    if (!(await this.productos.porId(m.productoId))) throw new NoEncontradoError("El producto");
    const [e] = await this.inventario.porProductos([m.productoId]);
    exigir(e, "El producto no tiene inventario");
    if (m.tipo === "ENTRADA") e.registrarEntrada(m.cantidad);
    else e.ajustar(m.cantidad);
    this.inventario.guardar(e);
    this.inventario.registrarMovimiento({ ...m, referencia: m.referencia.trim(), fecha: this.reloj.ahora() });
    await this.uow.confirmar();
  }
}
