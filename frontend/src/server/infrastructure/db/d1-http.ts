// Adaptador para Cloudflare D1 a través de su API REST.
// https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/query/
import { ConflictoError, ReglaDeNegocioError } from "../../domain/errores";
import type { BaseDatos, Fila, Sentencia, Valor } from "./base-datos";

interface RespuestaD1 {
  success: boolean;
  errors?: { code: number; message: string }[];
  result?: { success?: boolean; results?: Fila[] }[];
}

export interface ConfigD1 {
  accountId: string;
  databaseId: string;
  apiToken: string;
}

export class D1HttpBaseDatos implements BaseDatos {
  private readonly url: string;

  constructor(private readonly config: ConfigD1) {
    this.url = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/d1/database/${config.databaseId}/query`;
  }

  async consultar<T = Fila>(sql: string, params: Valor[] = []): Promise<T[]> {
    const [filas] = await this.enviar({ sql, params: params.map(aTexto) });
    return (filas ?? []) as T[];
  }

  async lote(sentencias: Sentencia[]): Promise<Fila[][]> {
    if (sentencias.length === 0) return [];
    return this.enviar({ batch: sentencias.map((s) => ({ sql: s.sql, params: (s.params ?? []).map(aTexto) })) });
  }

  private async enviar(cuerpo: unknown): Promise<Fila[][]> {
    const r = await fetch(this.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.config.apiToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
      cache: "no-store",
    });
    const json = (await r.json().catch(() => null)) as RespuestaD1 | null;
    if (!r.ok || !json?.success) {
      const mensaje = json?.errors?.map((e) => e.message).join("; ") || `D1 respondió ${r.status}`;
      throw traducirError(mensaje);
    }
    return (json.result ?? []).map((x) => x.results ?? []);
  }
}

// La API REST documenta los parámetros como texto; SQLite los convierte según el tipo de la columna.
const aTexto = (v: Valor): string | null => (v === null ? null : String(v));

export function traducirError(mensaje: string): Error {
  if (/UNIQUE constraint failed/i.test(mensaje)) return new ConflictoError("El dato ya está registrado");
  if (/CHECK constraint failed/i.test(mensaje)) return new ReglaDeNegocioError("La operación deja datos inválidos (por ejemplo, existencias negativas)");
  if (/FOREIGN KEY constraint failed/i.test(mensaje)) return new ReglaDeNegocioError("La operación hace referencia a un dato que no existe");
  return new Error(`Error de base de datos: ${mensaje}`);
}
