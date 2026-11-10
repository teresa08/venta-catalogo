// Raíz de composición: el único lugar que conoce las implementaciones concretas.
// Elige el adaptador de base de datos por variables de entorno y arma los casos de uso por petición.
import "server-only";
import { join } from "node:path";
import { IniciarSesion } from "./application/casos-uso/autenticacion";
import { GuardarCategoria, GuardarProducto, GuardarUsuario, GuardarVendedora } from "./application/casos-uso/administracion";
import { AprobarComisiones, CalcularComisiones, CerrarCampana, PublicarCampana } from "./application/casos-uso/campanas";
import { ObtenerEstado } from "./application/casos-uso/consultas";
import { CambiarEstadoPedido, EnviarPedido, RegistrarMovimiento } from "./application/casos-uso/pedidos";
import type { EmisorTokens } from "./application/puertos";
import type { BaseDatos } from "./infrastructure/db/base-datos";
import { D1HttpBaseDatos } from "./infrastructure/db/d1-http";
import { SqliteLocalBaseDatos } from "./infrastructure/db/sqlite-local";
import { Transaccion } from "./infrastructure/db/transaccion";
import { RelojSantoDomingo } from "./infrastructure/reloj";
import { SqlCampanaRepositorio, SqlCategoriaRepositorio, SqlProductoRepositorio } from "./infrastructure/repositorios/sql-catalogo";
import { SqlConsultaEstado } from "./infrastructure/repositorios/sql-consulta-estado";
import { SqlComisionRepositorio, SqlInventarioRepositorio, SqlPedidoRepositorio, SqlVendedoraRepositorio } from "./infrastructure/repositorios/sql-operacion";
import { SqlUsuarioRepositorio } from "./infrastructure/repositorios/sql-seguridad";
import { JwtEmisorTokens } from "./infrastructure/seguridad/jwt";
import { Pbkdf2CifradorClaves } from "./infrastructure/seguridad/pbkdf2";

function crearBaseDatos(): BaseDatos {
  const { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_API_TOKEN } = process.env;
  if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_D1_DATABASE_ID && CLOUDFLARE_API_TOKEN) {
    return new D1HttpBaseDatos({ accountId: CLOUDFLARE_ACCOUNT_ID, databaseId: CLOUDFLARE_D1_DATABASE_ID, apiToken: CLOUDFLARE_API_TOKEN });
  }
  if (process.env.NODE_ENV === "production" && !process.env.PERMITIR_SQLITE) {
    throw new Error("Faltan CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID o CLOUDFLARE_API_TOKEN");
  }
  return new SqliteLocalBaseDatos(process.env.SQLITE_PATH ?? ".data/venta-catalogo.db", join(process.cwd(), "..", "database", "d1", "migrations"));
}

function crearTokens(): EmisorTokens {
  const secreto = process.env.JWT_SECRET ?? (process.env.NODE_ENV === "production" ? "" : "solo-para-desarrollo-local-cambiar-en-produccion");
  return new JwtEmisorTokens(secreto);
}

// Recursos sin estado por petición: se crean una vez por instancia de la función.
let db: BaseDatos | undefined;
let tokens: EmisorTokens | undefined;
const reloj = new RelojSantoDomingo();
const cifrador = new Pbkdf2CifradorClaves();

export function emisorTokens(): EmisorTokens {
  return (tokens ??= crearTokens());
}

/** Casos de uso de una petición. Comparten una unidad de trabajo nueva. */
export function casosDeUso() {
  db ??= crearBaseDatos();
  const tx = new Transaccion(db);
  const usuarios = new SqlUsuarioRepositorio(db, tx);
  const categorias = new SqlCategoriaRepositorio(db, tx);
  const productos = new SqlProductoRepositorio(db, tx);
  const campanas = new SqlCampanaRepositorio(db, tx);
  const inventario = new SqlInventarioRepositorio(db, tx);
  const pedidos = new SqlPedidoRepositorio(db, tx);
  const vendedoras = new SqlVendedoraRepositorio(db, tx);
  const comisiones = new SqlComisionRepositorio(db, tx);

  return {
    iniciarSesion: new IniciarSesion(usuarios, vendedoras, cifrador, emisorTokens(), reloj, tx),
    obtenerEstado: new ObtenerEstado(new SqlConsultaEstado(db)),
    guardarUsuario: new GuardarUsuario(usuarios, cifrador, tx),
    guardarCategoria: new GuardarCategoria(categorias, tx),
    guardarProducto: new GuardarProducto(productos, categorias, tx),
    guardarVendedora: new GuardarVendedora(vendedoras, usuarios, tx),
    publicarCampana: new PublicarCampana(campanas, tx),
    cerrarCampana: new CerrarCampana(campanas, tx),
    calcularComisiones: new CalcularComisiones(campanas, pedidos, comisiones, tx),
    aprobarComisiones: new AprobarComisiones(comisiones, tx),
    enviarPedido: new EnviarPedido(pedidos, campanas, productos, vendedoras, inventario, reloj, tx),
    cambiarEstadoPedido: new CambiarEstadoPedido(pedidos, inventario, reloj, tx),
    registrarMovimiento: new RegistrarMovimiento(inventario, productos, reloj, tx),
  };
}

export type CasosDeUso = ReturnType<typeof casosDeUso>;
