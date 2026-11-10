// Adaptador de desarrollo: archivo SQLite local con node:sqlite (Node 22.5+).
// Usa las mismas migraciones que D1, así el comportamiento es igual al de producción.
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { BaseDatos, Fila, Sentencia, Valor } from "./base-datos";
import { traducirError } from "./d1-http";

interface Sentenciable {
  all(...p: Valor[]): unknown[];
}
interface BaseSqlite {
  exec(sql: string): void;
  prepare(sql: string): Sentenciable;
}

export class SqliteLocalBaseDatos implements BaseDatos {
  private db: Promise<BaseSqlite>;

  constructor(ruta: string, carpetaMigraciones: string) {
    this.db = abrir(resolve(ruta), resolve(carpetaMigraciones));
  }

  async consultar<T = Fila>(sql: string, params: Valor[] = []): Promise<T[]> {
    const db = await this.db;
    try {
      return db.prepare(sql).all(...params) as T[];
    } catch (e) {
      throw traducirError((e as Error).message);
    }
  }

  async lote(sentencias: Sentencia[]): Promise<Fila[][]> {
    const db = await this.db;
    db.exec("BEGIN");
    try {
      const filas = sentencias.map((s) => db.prepare(s.sql).all(...(s.params ?? [])) as Fila[]);
      db.exec("COMMIT");
      return filas;
    } catch (e) {
      db.exec("ROLLBACK");
      throw traducirError((e as Error).message);
    }
  }
}

async function abrir(ruta: string, carpetaMigraciones: string): Promise<BaseSqlite> {
  // Import dinámico para que el empaquetador no intente incluir node:sqlite en producción.
  const { DatabaseSync } = await import(/* webpackIgnore: true */ "node:sqlite");
  const nueva = !existsSync(ruta);
  mkdirSync(dirname(ruta), { recursive: true });
  const db = new DatabaseSync(ruta) as unknown as BaseSqlite;
  db.exec("PRAGMA foreign_keys = ON");
  if (nueva) {
    for (const f of readdirSync(carpetaMigraciones).filter((x) => x.endsWith(".sql")).sort()) {
      db.exec(readFileSync(join(carpetaMigraciones, f), "utf8"));
    }
    console.log(`[db] Base local creada en ${ruta}`);
  }
  return db;
}
