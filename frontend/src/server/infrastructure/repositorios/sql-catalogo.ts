import type { CampanaRepositorio, CategoriaRepositorio, ProductoRepositorio } from "../../application/puertos";
import { Campana } from "../../domain/campana";
import type { Categoria, ItemCatalogo, Producto } from "../../domain/tipos";
import { b, type BaseDatos } from "../db/base-datos";
import type { Transaccion } from "../db/transaccion";
import { aCampana, aItem, aProducto, COL } from "./mapeo";

export class SqlCategoriaRepositorio implements CategoriaRepositorio {
  constructor(private readonly db: BaseDatos, private readonly tx: Transaccion) {}

  async existe(id: number): Promise<boolean> {
    return (await this.db.consultar(`SELECT 1 FROM categoria WHERE id = ?`, [id])).length > 0;
  }

  async nombreEnUso(nombre: string, exceptoId: number): Promise<boolean> {
    return (await this.db.consultar(`SELECT 1 FROM categoria WHERE nombre = ? AND id <> ?`, [nombre, exceptoId])).length > 0;
  }

  agregar(c: Omit<Categoria, "id">): void {
    this.tx.anotar({ sql: `INSERT INTO categoria (nombre, descripcion, activa) VALUES (?, ?, ?)`, params: [c.nombre, c.descripcion, b(c.activa)] });
  }

  actualizar(c: Categoria): void {
    this.tx.anotar({
      sql: `UPDATE categoria SET nombre = ?, descripcion = ?, activa = ? WHERE id = ?`,
      params: [c.nombre, c.descripcion, b(c.activa), c.id],
    });
  }
}

export class SqlProductoRepositorio implements ProductoRepositorio {
  constructor(private readonly db: BaseDatos, private readonly tx: Transaccion) {}

  async porId(id: number): Promise<Producto | null> {
    const [f] = await this.db.consultar(`SELECT ${COL.producto} FROM producto WHERE id = ?`, [id]);
    return f ? aProducto(f) : null;
  }

  async porIds(ids: number[]): Promise<Producto[]> {
    if (ids.length === 0) return [];
    const filas = await this.db.consultar(`SELECT ${COL.producto} FROM producto WHERE id IN (${ids.map(() => "?").join(",")})`, ids);
    return filas.map(aProducto);
  }

  async skuEnUso(sku: string, exceptoId: number): Promise<boolean> {
    return (await this.db.consultar(`SELECT 1 FROM producto WHERE sku = ? AND id <> ?`, [sku, exceptoId])).length > 0;
  }

  agregar(p: Omit<Producto, "id">, minimo: number): void {
    this.tx.anotar(
      {
        sql: `INSERT INTO producto (sku, nombre, descripcion, categoria_id, precio_base, activo, tono) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        params: [p.sku, p.nombre, p.descripcion, p.categoriaId, p.precioBase, b(p.activo), p.tono],
      },
      // El SKU es único: sirve para enlazar el inventario dentro del mismo lote.
      { sql: `INSERT INTO inventario (producto_id, existencia, reservado, minimo) SELECT id, 0, 0, ? FROM producto WHERE sku = ?`, params: [minimo, p.sku] },
    );
  }

  actualizar(p: Producto): void {
    this.tx.anotar({
      sql: `UPDATE producto SET sku = ?, nombre = ?, descripcion = ?, categoria_id = ?, precio_base = ?, activo = ?, tono = ? WHERE id = ?`,
      params: [p.sku, p.nombre, p.descripcion, p.categoriaId, p.precioBase, b(p.activo), p.tono, p.id],
    });
  }
}

export class SqlCampanaRepositorio implements CampanaRepositorio {
  constructor(private readonly db: BaseDatos, private readonly tx: Transaccion) {}

  async porId(id: number): Promise<Campana | null> {
    const [f] = await this.db.consultar(`SELECT ${COL.campana} FROM campana WHERE id = ?`, [id]);
    return f ? Campana.reconstruir(aCampana(f)) : null;
  }

  async publicada(): Promise<Campana | null> {
    const [f] = await this.db.consultar(`SELECT ${COL.campana} FROM campana WHERE estado = 'PUBLICADA' LIMIT 1`);
    return f ? Campana.reconstruir(aCampana(f)) : null;
  }

  async itemsCatalogo(campanaId: number): Promise<ItemCatalogo[]> {
    return (await this.db.consultar(`SELECT ${COL.catalogo} FROM catalogo_item WHERE campana_id = ?`, [campanaId])).map(aItem);
  }

  guardar(c: Campana): void {
    this.tx.anotar({ sql: `UPDATE campana SET estado = ? WHERE id = ?`, params: [c.estado, c.id] });
  }
}
