// CU015 usuarios, CU020 categorías, CU025 productos, CU055 vendedoras.
import { ConflictoError, exigir, NoEncontradoError, ReglaDeNegocioError } from "../../domain/errores";
import type { Categoria, Producto, Usuario, Vendedora } from "../../domain/tipos";
import { exigirPermiso } from "../autorizacion";
import type {
  CategoriaRepositorio,
  CifradorClaves,
  ProductoRepositorio,
  Sesion,
  UnidadDeTrabajo,
  UsuarioRepositorio,
  VendedoraRepositorio,
} from "../puertos";

export type DatosUsuario = Omit<Usuario, "ultimoAcceso"> & { clave?: string };

export class GuardarUsuario {
  constructor(
    private readonly usuarios: UsuarioRepositorio,
    private readonly cifrador: CifradorClaves,
    private readonly uow: UnidadDeTrabajo,
  ) {}

  async ejecutar(sesion: Sesion | null, u: DatosUsuario): Promise<void> {
    const s = exigirPermiso(sesion, "usuarios.gestionar");
    const email = u.email.trim().toLowerCase();
    if (await this.usuarios.emailEnUso(email, u.id)) throw new ConflictoError("Ese correo ya pertenece a otro usuario");
    if (!(await this.usuarios.rolExiste(u.rolId))) throw new NoEncontradoError("El rol");

    if (u.id === 0) {
      exigir(u.clave && u.clave.length >= 8, "La contraseña inicial debe tener al menos 8 caracteres");
      this.usuarios.agregar({ nombre: u.nombre.trim(), email, rolId: u.rolId, activo: u.activo }, await this.cifrador.cifrar(u.clave));
    } else {
      const actual = await this.usuarios.porId(u.id);
      if (!actual) throw new NoEncontradoError("El usuario");
      if (u.id === s.usuarioId && (u.rolId !== actual.rolId || !u.activo)) {
        throw new ReglaDeNegocioError("No puedes cambiar tu propio rol ni desactivarte");
      }
      this.usuarios.actualizar({ ...actual, nombre: u.nombre.trim(), email, rolId: u.rolId, activo: u.activo });
    }
    await this.uow.confirmar();
  }
}

export class GuardarCategoria {
  constructor(private readonly categorias: CategoriaRepositorio, private readonly uow: UnidadDeTrabajo) {}

  async ejecutar(sesion: Sesion | null, c: Categoria): Promise<void> {
    exigirPermiso(sesion, "catalogo.gestionar");
    const nombre = c.nombre.trim();
    if (await this.categorias.nombreEnUso(nombre, c.id)) throw new ConflictoError("Ya existe una categoría con ese nombre");
    if (c.id === 0) this.categorias.agregar({ ...c, nombre });
    else {
      if (!(await this.categorias.existe(c.id))) throw new NoEncontradoError("La categoría");
      this.categorias.actualizar({ ...c, nombre });
    }
    await this.uow.confirmar();
  }
}

export class GuardarProducto {
  constructor(
    private readonly productos: ProductoRepositorio,
    private readonly categorias: CategoriaRepositorio,
    private readonly uow: UnidadDeTrabajo,
  ) {}

  async ejecutar(sesion: Sesion | null, p: Producto): Promise<void> {
    exigirPermiso(sesion, "catalogo.gestionar");
    const sku = p.sku.trim().toUpperCase();
    if (await this.productos.skuEnUso(sku, p.id)) throw new ConflictoError(`El SKU ${sku} ya está registrado`);
    if (!(await this.categorias.existe(p.categoriaId))) throw new NoEncontradoError("La categoría");
    const datos = { ...p, sku, nombre: p.nombre.trim() };
    if (p.id === 0) this.productos.agregar(datos, 10);
    else {
      if (!(await this.productos.porId(p.id))) throw new NoEncontradoError("El producto");
      this.productos.actualizar(datos);
    }
    await this.uow.confirmar();
  }
}

export class GuardarVendedora {
  constructor(
    private readonly vendedoras: VendedoraRepositorio,
    private readonly usuarios: UsuarioRepositorio,
    private readonly uow: UnidadDeTrabajo,
  ) {}

  async ejecutar(sesion: Sesion | null, v: Vendedora): Promise<void> {
    exigirPermiso(sesion, "vendedoras.gestionar");
    if (await this.vendedoras.cedulaEnUso(v.cedula.trim(), v.id)) throw new ConflictoError("Esa cédula ya pertenece a otra vendedora");
    if (v.usuarioId !== null) {
      if (!(await this.usuarios.porId(v.usuarioId))) throw new NoEncontradoError("El usuario");
      if (await this.vendedoras.usuarioEnUso(v.usuarioId, v.id)) throw new ConflictoError("Ese usuario ya está asociado a otra vendedora");
    }
    const datos = { ...v, nombre: v.nombre.trim(), cedula: v.cedula.trim(), telefono: v.telefono.trim() };
    if (v.id === 0) this.vendedoras.agregar(datos);
    else {
      const actual = await this.vendedoras.porId(v.id);
      if (!actual) throw new NoEncontradoError("La vendedora");
      this.vendedoras.actualizar({ ...datos, codigo: actual.codigo });
    }
    await this.uow.confirmar();
  }
}
