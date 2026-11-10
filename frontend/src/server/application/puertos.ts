// Puertos de salida: lo que la aplicación necesita del mundo exterior.
// La infraestructura los implementa (adaptadores); los casos de uso solo conocen estas interfaces.
import type { Campana } from "../domain/campana";
import type { Existencia } from "../domain/inventario";
import type { Pedido } from "../domain/pedido";
import type {
  Campana as CampanaDatos,
  Existencia as ExistenciaDatos,
  Categoria,
  Comision,
  ItemCatalogo,
  MovimientoInventario,
  NivelComision,
  PagoVendedora,
  Pedido as PedidoDatos,
  Producto,
  RolCodigo,
  Rol,
  Usuario,
  Vendedora,
} from "../domain/tipos";

// --- Transversales -----------------------------------------------------------

/** Agrupa las escrituras de un caso de uso para confirmarlas juntas (todo o nada). */
export interface UnidadDeTrabajo {
  confirmar(): Promise<void>;
}

export interface Reloj {
  /** Fecha y hora local de Santo Domingo: "2026-10-21T08:12:00". */
  ahora(): string;
}

export interface CifradorClaves {
  cifrar(clave: string): Promise<string>;
  verificar(clave: string, hash: string): Promise<boolean>;
}

export interface Sesion {
  usuarioId: number;
  rol: RolCodigo;
  permisos: string[];
  vendedoraId: number | null;
}

export interface EmisorTokens {
  emitir(sesion: Sesion): Promise<string>;
  verificar(token: string): Promise<Sesion | null>;
}

// --- Repositorios (escritura) ------------------------------------------------

export interface UsuarioConCredenciales extends Usuario {
  claveHash: string;
  rol: RolCodigo;
  permisos: string[];
}

export interface UsuarioRepositorio {
  porEmail(email: string): Promise<UsuarioConCredenciales | null>;
  porId(id: number): Promise<Usuario | null>;
  emailEnUso(email: string, exceptoId: number): Promise<boolean>;
  rolExiste(rolId: number): Promise<boolean>;
  agregar(u: Omit<Usuario, "id" | "ultimoAcceso">, claveHash: string): void;
  actualizar(u: Usuario): void;
  registrarAcceso(id: number, fecha: string): void;
}

export interface CategoriaRepositorio {
  existe(id: number): Promise<boolean>;
  nombreEnUso(nombre: string, exceptoId: number): Promise<boolean>;
  agregar(c: Omit<Categoria, "id">): void;
  actualizar(c: Categoria): void;
}

export interface ProductoRepositorio {
  porId(id: number): Promise<Producto | null>;
  porIds(ids: number[]): Promise<Producto[]>;
  skuEnUso(sku: string, exceptoId: number): Promise<boolean>;
  /** Agrega el producto con su registro de inventario vacío. */
  agregar(p: Omit<Producto, "id">, minimo: number): void;
  actualizar(p: Producto): void;
}

export interface CampanaRepositorio {
  porId(id: number): Promise<Campana | null>;
  publicada(): Promise<Campana | null>;
  itemsCatalogo(campanaId: number): Promise<ItemCatalogo[]>;
  guardar(c: Campana): void;
}

export interface InventarioRepositorio {
  porProductos(ids: number[]): Promise<Existencia[]>;
  guardar(e: Existencia): void;
  registrarMovimiento(m: Omit<MovimientoInventario, "id">): void;
}

export interface PedidoRepositorio {
  porId(id: number): Promise<Pedido | null>;
  ultimoConsecutivo(anio: number): Promise<number>;
  /** Subtotales de los pedidos no cancelados de una campaña. */
  ventasDeCampana(campanaId: number): Promise<{ vendedoraId: number; subtotal: number }[]>;
  agregar(p: Pedido): void;
  guardar(p: Pedido): void;
}

export interface VendedoraRepositorio {
  porId(id: number): Promise<Vendedora | null>;
  porUsuario(usuarioId: number): Promise<Vendedora | null>;
  cedulaEnUso(cedula: string, exceptoId: number): Promise<boolean>;
  usuarioEnUso(usuarioId: number, exceptoId: number): Promise<boolean>;
  agregar(v: Omit<Vendedora, "id" | "codigo">): void;
  actualizar(v: Vendedora): void;
}

export interface ComisionRepositorio {
  niveles(): Promise<NivelComision[]>;
  deCampana(campanaId: number): Promise<Comision[]>;
  reemplazar(campanaId: number, comisiones: Comision[]): void;
  aprobar(campanaId: number): void;
}

// --- Consultas (lectura) -----------------------------------------------------

export interface EstadoPublico {
  roles: Rol[];
  categorias: Categoria[];
  productos: Producto[];
  campanas: CampanaDatos[];
  catalogo: ItemCatalogo[];
  nivelesComision: NivelComision[];
}

export interface EstadoPrivado {
  usuarios: Usuario[];
  vendedoras: Vendedora[];
  existencias: ExistenciaDatos[];
  movimientos: MovimientoInventario[];
  pedidos: PedidoDatos[];
  comisiones: Comision[];
  pagos: PagoVendedora[];
}

/** Filtro de lo que puede ver una sesión: null = todo (administración). */
export interface Alcance {
  usuarioId: number | null;
  vendedoraId: number | null;
  verMovimientos: boolean;
}

export interface ConsultaEstado {
  publico(): Promise<EstadoPublico>;
  completo(alcance: Alcance): Promise<EstadoPublico & EstadoPrivado>;
}
