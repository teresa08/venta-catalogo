// Lado de lectura: arma todo el estado en un único lote de SELECT (una sola llamada HTTP a D1).
import type { Alcance, ConsultaEstado, EstadoPrivado, EstadoPublico } from "../../application/puertos";
import type { Rol, RolCodigo } from "../../domain/tipos";
import type { BaseDatos, Fila, Sentencia } from "../db/base-datos";
import {
  aCampana,
  aCategoria,
  aComision,
  aExistencia,
  aItem,
  aMovimiento,
  aNivel,
  aPago,
  aProducto,
  armarPedidos,
  aUsuario,
  aVendedora,
  COL,
  consultasPedidos,
} from "./mapeo";

const PUBLICAS: Sentencia[] = [
  { sql: `SELECT id, codigo, nombre FROM rol ORDER BY id` },
  { sql: `SELECT rol_id AS rolId, permiso FROM rol_permiso ORDER BY rowid` },
  { sql: `SELECT ${COL.categoria} FROM categoria ORDER BY id` },
  { sql: `SELECT ${COL.producto} FROM producto ORDER BY id` },
  { sql: `SELECT ${COL.campana} FROM campana ORDER BY anio, numero` },
  { sql: `SELECT ${COL.catalogo} FROM catalogo_item ORDER BY campana_id, pagina` },
  { sql: `SELECT ${COL.nivel} FROM nivel_comision ORDER BY minimo` },
];

function armarPublico(f: Fila[][]): EstadoPublico {
  const [roles, permisos, categorias, productos, campanas, catalogo, niveles] = f;
  return {
    roles: roles.map(
      (r): Rol => ({
        id: Number(r.id),
        codigo: String(r.codigo) as RolCodigo,
        nombre: String(r.nombre),
        permisos: permisos.filter((p) => Number(p.rolId) === Number(r.id)).map((p) => String(p.permiso)),
      }),
    ),
    categorias: categorias.map(aCategoria),
    productos: productos.map(aProducto),
    campanas: campanas.map(aCampana),
    catalogo: catalogo.map(aItem),
    nivelesComision: niveles.map(aNivel),
  };
}

export class SqlConsultaEstado implements ConsultaEstado {
  constructor(private readonly db: BaseDatos) {}

  async publico(): Promise<EstadoPublico> {
    return armarPublico(await this.db.lote(PUBLICAS));
  }

  async completo(a: Alcance): Promise<EstadoPublico & EstadoPrivado> {
    const u = [a.usuarioId, a.usuarioId];
    const v = [a.vendedoraId, a.vendedoraId];
    const porVendedora = `(? IS NULL OR p.vendedora_id = ?)`;
    const privadas: Sentencia[] = [
      { sql: `SELECT ${COL.usuario} FROM usuario WHERE (? IS NULL OR id = ?) ORDER BY id`, params: u },
      { sql: `SELECT ${COL.vendedora} FROM vendedora WHERE (? IS NULL OR id = ?) ORDER BY id`, params: v },
      { sql: `SELECT ${COL.existencia} FROM inventario ORDER BY producto_id` },
      { sql: `SELECT ${COL.movimiento} FROM movimiento_inventario WHERE CAST(? AS INTEGER) = 1 ORDER BY fecha DESC, id DESC LIMIT 200`, params: [a.verMovimientos ? 1 : 0] },
      { sql: `SELECT ${COL.comision} FROM comision WHERE (? IS NULL OR vendedora_id = ?)`, params: v },
      { sql: `SELECT ${COL.pago} FROM pago_vendedora WHERE (? IS NULL OR vendedora_id = ?) ORDER BY fecha`, params: v },
      ...consultasPedidos(porVendedora).map((sql) => ({ sql, params: v })),
    ];
    const filas = await this.db.lote([...PUBLICAS, ...privadas]);
    const publico = armarPublico(filas.slice(0, PUBLICAS.length));
    const [usuarios, vendedoras, existencias, movimientos, comisiones, pagos, ...pedidos] = filas.slice(PUBLICAS.length);
    const [p, d, h, f, des] = pedidos;
    return {
      ...publico,
      usuarios: usuarios.map(aUsuario),
      vendedoras: vendedoras.map(aVendedora),
      existencias: existencias.map(aExistencia),
      movimientos: movimientos.map(aMovimiento),
      comisiones: comisiones.map(aComision),
      pagos: pagos.map(aPago),
      pedidos: armarPedidos(p, d, h, f, des),
    };
  }
}
