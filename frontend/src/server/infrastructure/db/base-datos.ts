// Abstracción mínima de SQL que comparten los adaptadores de D1 (producción) y SQLite (desarrollo).
export type Valor = string | number | null;

export interface Sentencia {
  sql: string;
  params?: Valor[];
}

export type Fila = Record<string, unknown>;

export interface BaseDatos {
  consultar<T = Fila>(sql: string, params?: Valor[]): Promise<T[]>;
  /** Ejecuta las sentencias en orden dentro de una sola transacción y devuelve las filas de cada una. */
  lote(sentencias: Sentencia[]): Promise<Fila[][]>;
}

/** Convierte booleanos a 0/1 como los guarda SQLite. */
export const b = (x: boolean): number => (x ? 1 : 0);
