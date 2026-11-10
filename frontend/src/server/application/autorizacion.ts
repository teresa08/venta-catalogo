import { AccesoDenegadoError, NoAutenticadoError } from "../domain/errores";
import type { Sesion } from "./puertos";

export type Permiso =
  | "usuarios.gestionar"
  | "catalogo.gestionar"
  | "campanas.publicar"
  | "pedidos.facturar"
  | "pedidos.despachar"
  | "inventario.gestionar"
  | "vendedoras.gestionar"
  | "comisiones.calcular"
  | "reportes.ver"
  | "catalogo.consultar"
  | "pedidos.registrar"
  | "pedidos.consultar"
  | "cuenta.consultar";

/** Devuelve la sesión si existe y tiene el permiso; si no, lanza el error que corresponde. */
export function exigirPermiso(sesion: Sesion | null, permiso: Permiso): Sesion {
  if (!sesion) throw new NoAutenticadoError();
  if (!sesion.permisos.includes(permiso)) throw new AccesoDenegadoError();
  return sesion;
}
