import type { UnidadDeTrabajo } from "../../application/puertos";
import type { BaseDatos, Sentencia } from "./base-datos";

/**
 * Unidad de trabajo: los repositorios anotan aquí sus escrituras y el caso de uso
 * las confirma todas en un solo lote (una transacción en D1 o en SQLite).
 */
export class Transaccion implements UnidadDeTrabajo {
  private pendientes: Sentencia[] = [];

  constructor(private readonly db: BaseDatos) {}

  anotar(...sentencias: Sentencia[]): void {
    this.pendientes.push(...sentencias);
  }

  async confirmar(): Promise<void> {
    const lote = this.pendientes;
    this.pendientes = [];
    await this.db.lote(lote);
  }
}
