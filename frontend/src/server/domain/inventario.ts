// Entidad Existencia: unidades en almacén y unidades reservadas por pedidos sin despachar (CU070).
import { exigir } from "./errores";
import type { Existencia as ExistenciaDatos } from "./tipos";

export class Existencia {
  private constructor(private datos: ExistenciaDatos) {}

  static reconstruir(datos: ExistenciaDatos): Existencia {
    return new Existencia({ ...datos });
  }

  static nueva(productoId: number, minimo = 10): Existencia {
    return new Existencia({ productoId, existencia: 0, reservado: 0, minimo });
  }

  get productoId() { return this.datos.productoId; }
  get disponible() { return this.datos.existencia - this.datos.reservado; }

  /** Al enviar el pedido las unidades quedan apartadas para la vendedora. */
  reservar(cantidad: number, producto: string): void {
    exigir(cantidad > 0, "La cantidad a reservar debe ser mayor que cero");
    exigir(cantidad <= this.disponible, `Solo quedan ${this.disponible} unidades de ${producto}`);
    this.datos.reservado += cantidad;
  }

  /** Al cancelar el pedido se liberan las unidades reservadas. */
  liberar(cantidad: number): void {
    this.datos.reservado = Math.max(0, this.datos.reservado - cantidad);
  }

  /** Al despachar, lo reservado sale del almacén. */
  despachar(cantidad: number): void {
    this.datos.existencia = Math.max(0, this.datos.existencia - cantidad);
    this.datos.reservado = Math.max(0, this.datos.reservado - cantidad);
  }

  registrarEntrada(cantidad: number): void {
    exigir(Number.isInteger(cantidad) && cantidad > 0, "La entrada debe ser un número entero mayor que cero");
    this.datos.existencia += cantidad;
  }

  /** Ajuste por conteo físico: puede ser positivo o negativo, pero no dejar menos de lo reservado. */
  ajustar(cantidad: number): void {
    exigir(Number.isInteger(cantidad) && cantidad !== 0, "El ajuste debe ser un número entero distinto de cero");
    exigir(
      this.datos.existencia + cantidad >= this.datos.reservado,
      `El ajuste dejaría menos unidades (${this.datos.existencia + cantidad}) que las reservadas (${this.datos.reservado})`,
    );
    this.datos.existencia += cantidad;
  }

  aDatos(): ExistenciaDatos {
    return { ...this.datos };
  }
}
