import type { ComisionRepositorio, InventarioRepositorio, PedidoRepositorio, VendedoraRepositorio } from "../../application/puertos";
import { Existencia } from "../../domain/inventario";
import { Pedido } from "../../domain/pedido";
import type { Comision, MovimientoInventario, NivelComision, Vendedora } from "../../domain/tipos";
import type { BaseDatos } from "../db/base-datos";
import type { Transaccion } from "../db/transaccion";
import { aComision, aExistencia, armarPedidos, aNivel, aVendedora, COL, consultasPedidos } from "./mapeo";

export class SqlInventarioRepositorio implements InventarioRepositorio {
  constructor(private readonly db: BaseDatos, private readonly tx: Transaccion) {}

  async porProductos(ids: number[]): Promise<Existencia[]> {
    if (ids.length === 0) return [];
    const filas = await this.db.consultar(`SELECT ${COL.existencia} FROM inventario WHERE producto_id IN (${ids.map(() => "?").join(",")})`, ids);
    return filas.map((f) => Existencia.reconstruir(aExistencia(f)));
  }

  guardar(e: Existencia): void {
    const d = e.aDatos();
    this.tx.anotar({
      sql: `UPDATE inventario SET existencia = ?, reservado = ?, minimo = ? WHERE producto_id = ?`,
      params: [d.existencia, d.reservado, d.minimo, d.productoId],
    });
  }

  registrarMovimiento(m: Omit<MovimientoInventario, "id">): void {
    this.tx.anotar({
      sql: `INSERT INTO movimiento_inventario (producto_id, tipo, cantidad, referencia, fecha) VALUES (?, ?, ?, ?, ?)`,
      params: [m.productoId, m.tipo, m.cantidad, m.referencia, m.fecha],
    });
  }
}

export class SqlPedidoRepositorio implements PedidoRepositorio {
  constructor(private readonly db: BaseDatos, private readonly tx: Transaccion) {}

  async porId(id: number): Promise<Pedido | null> {
    const [p, d, h, f, des] = await this.db.lote(consultasPedidos("p.id = ?").map((sql) => ({ sql, params: [id] })));
    const [datos] = armarPedidos(p, d, h, f, des);
    return datos ? Pedido.reconstruir(datos) : null;
  }

  async ultimoConsecutivo(anio: number): Promise<number> {
    const [f] = await this.db.consultar<{ ultimo: number | null }>(
      `SELECT MAX(CAST(substr(numero, -6) AS INTEGER)) AS ultimo FROM pedido WHERE numero LIKE ?`,
      [`PED-${anio}-%`],
    );
    return Number(f?.ultimo ?? 0);
  }

  async ventasDeCampana(campanaId: number): Promise<{ vendedoraId: number; subtotal: number }[]> {
    const filas = await this.db.consultar(
      `SELECT p.vendedora_id AS vendedoraId, ROUND(SUM(d.cantidad * d.precio), 2) AS subtotal
       FROM pedido p JOIN pedido_detalle d ON d.pedido_id = p.id
       WHERE p.campana_id = ? AND p.estado <> 'CANCELADO'
       GROUP BY p.id`,
      [campanaId],
    );
    return filas.map((f) => ({ vendedoraId: Number(f.vendedoraId), subtotal: Number(f.subtotal) }));
  }

  agregar(p: Pedido): void {
    const d = p.aDatos();
    // El número es único: las filas hijas se enlazan con él dentro del mismo lote.
    const idPorNumero = `(SELECT id FROM pedido WHERE numero = ?)`;
    this.tx.anotar({
      sql: `INSERT INTO pedido (numero, campana_id, vendedora_id, cliente, estado, fecha) VALUES (?, ?, ?, ?, ?, ?)`,
      params: [d.numero, d.campanaId, d.vendedoraId, d.cliente, d.estado, d.historial[0].fecha],
    });
    for (const l of d.lineas) {
      this.tx.anotar({
        sql: `INSERT INTO pedido_detalle (pedido_id, producto_id, cantidad, precio) VALUES (${idPorNumero}, ?, ?, ?)`,
        params: [d.numero, l.productoId, l.cantidad, l.precio],
      });
    }
    for (const h of p.cambiosPendientes) {
      this.tx.anotar({
        sql: `INSERT INTO pedido_historial (pedido_id, estado, fecha, nota) VALUES (${idPorNumero}, ?, ?, ?)`,
        params: [d.numero, h.estado, h.fecha, h.nota ?? null],
      });
    }
  }

  guardar(p: Pedido): void {
    this.tx.anotar({ sql: `UPDATE pedido SET estado = ? WHERE id = ?`, params: [p.estado, p.id] });
    for (const h of p.cambiosPendientes) {
      this.tx.anotar({
        sql: `INSERT INTO pedido_historial (pedido_id, estado, fecha, nota) VALUES (?, ?, ?, ?)`,
        params: [p.id, h.estado, h.fecha, h.nota ?? null],
      });
    }
    if (p.factura) {
      this.tx.anotar({
        sql: `INSERT INTO factura (pedido_id, numero, fecha) VALUES (?, ?, ?) ON CONFLICT(pedido_id) DO NOTHING`,
        params: [p.id, p.factura.numero, p.factura.fecha],
      });
    }
    if (p.despacho) {
      const x = p.despacho;
      this.tx.anotar({
        sql: `INSERT INTO despacho (pedido_id, mensajero, guia, salida, entrega) VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(pedido_id) DO UPDATE SET entrega = excluded.entrega`,
        params: [p.id, x.mensajero, x.guia, x.salida, x.entrega],
      });
    }
  }
}

export class SqlVendedoraRepositorio implements VendedoraRepositorio {
  constructor(private readonly db: BaseDatos, private readonly tx: Transaccion) {}

  async porId(id: number): Promise<Vendedora | null> {
    const [f] = await this.db.consultar(`SELECT ${COL.vendedora} FROM vendedora WHERE id = ?`, [id]);
    return f ? aVendedora(f) : null;
  }

  async porUsuario(usuarioId: number): Promise<Vendedora | null> {
    const [f] = await this.db.consultar(`SELECT ${COL.vendedora} FROM vendedora WHERE usuario_id = ?`, [usuarioId]);
    return f ? aVendedora(f) : null;
  }

  async cedulaEnUso(cedula: string, exceptoId: number): Promise<boolean> {
    return (await this.db.consultar(`SELECT 1 FROM vendedora WHERE cedula = ? AND id <> ?`, [cedula, exceptoId])).length > 0;
  }

  async usuarioEnUso(usuarioId: number, exceptoId: number): Promise<boolean> {
    return (await this.db.consultar(`SELECT 1 FROM vendedora WHERE usuario_id = ? AND id <> ?`, [usuarioId, exceptoId])).length > 0;
  }

  agregar(v: Omit<Vendedora, "id" | "codigo">): void {
    this.tx.anotar({
      sql: `INSERT INTO vendedora (usuario_id, codigo, nombre, cedula, telefono, zona, fecha_ingreso, estado)
            VALUES (?, 'V-' || printf('%04d', (SELECT COALESCE(MAX(id), 0) + 1 FROM vendedora)), ?, ?, ?, ?, ?, ?)`,
      params: [v.usuarioId, v.nombre, v.cedula, v.telefono, v.zona, v.fechaIngreso, v.estado],
    });
  }

  actualizar(v: Vendedora): void {
    this.tx.anotar({
      sql: `UPDATE vendedora SET usuario_id = ?, nombre = ?, cedula = ?, telefono = ?, zona = ?, fecha_ingreso = ?, estado = ? WHERE id = ?`,
      params: [v.usuarioId, v.nombre, v.cedula, v.telefono, v.zona, v.fechaIngreso, v.estado, v.id],
    });
  }
}

export class SqlComisionRepositorio implements ComisionRepositorio {
  constructor(private readonly db: BaseDatos, private readonly tx: Transaccion) {}

  async niveles(): Promise<NivelComision[]> {
    return (await this.db.consultar(`SELECT ${COL.nivel} FROM nivel_comision ORDER BY minimo`)).map(aNivel);
  }

  async deCampana(campanaId: number): Promise<Comision[]> {
    return (await this.db.consultar(`SELECT ${COL.comision} FROM comision WHERE campana_id = ?`, [campanaId])).map(aComision);
  }

  reemplazar(campanaId: number, comisiones: Comision[]): void {
    this.tx.anotar({ sql: `DELETE FROM comision WHERE campana_id = ?`, params: [campanaId] });
    for (const c of comisiones) {
      this.tx.anotar({
        sql: `INSERT INTO comision (vendedora_id, campana_id, ventas, porcentaje, monto, estado) VALUES (?, ?, ?, ?, ?, ?)`,
        params: [c.vendedoraId, c.campanaId, c.ventas, c.porcentaje, c.monto, c.estado],
      });
    }
  }

  aprobar(campanaId: number): void {
    this.tx.anotar({ sql: `UPDATE comision SET estado = 'APROBADA' WHERE campana_id = ? AND estado = 'CALCULADA'`, params: [campanaId] });
  }
}
