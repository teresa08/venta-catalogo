// Cliente HTTP del API (/api/...). Mismo origen: en Netlify el frontend y el API se despliegan juntos.
import type { Categoria, LineaCarrito, Producto, Usuario, Vendedora } from "./types";
import type { EstadoVisible } from "@/server/application/casos-uso/consultas";

export type { EstadoVisible };

export class ErrorApi extends Error {
  constructor(public readonly status: number, mensaje: string) {
    super(mensaje);
  }
}

const CLAVE_TOKEN = "venta-catalogo:token";

export const token = {
  leer: (): string | null => {
    try {
      return localStorage.getItem(CLAVE_TOKEN);
    } catch {
      return null;
    }
  },
  guardar: (t: string | null) => {
    try {
      if (t) localStorage.setItem(CLAVE_TOKEN, t);
      else localStorage.removeItem(CLAVE_TOKEN);
    } catch {
      /* sin almacenamiento: la sesión dura lo que la pestaña */
    }
  },
};

async function pedir<T>(metodo: "GET" | "POST" | "PUT", ruta: string, cuerpo?: unknown): Promise<T> {
  const t = token.leer();
  const r = await fetch(`/api${ruta}`, {
    method: metodo,
    headers: { ...(cuerpo !== undefined && { "Content-Type": "application/json" }), ...(t && { Authorization: `Bearer ${t}` }) },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    cache: "no-store",
  });
  if (r.status === 204) return undefined as T;
  const json = await r.json().catch(() => ({}));
  if (!r.ok) {
    const detalle = Array.isArray(json.detalles) && json.detalles[0] ? `: ${json.detalles[0].campo} ${json.detalles[0].mensaje}` : "";
    throw new ErrorApi(r.status, (json.error ?? `Error ${r.status}`) + detalle);
  }
  return json as T;
}

const guardar = (recurso: string, datos: { id: number }) =>
  datos.id ? pedir<void>("PUT", `/${recurso}/${datos.id}`, datos) : pedir<void>("POST", `/${recurso}`, datos);

export const api = {
  estado: () => pedir<EstadoVisible>("GET", "/estado"),
  login: (email: string, clave: string) => pedir<{ token: string; usuario: Usuario }>("POST", "/auth/login", { email, clave }),
  guardarUsuario: (u: Usuario & { clave?: string }) => guardar("usuarios", u),
  guardarCategoria: (c: Categoria) => guardar("categorias", c),
  guardarProducto: (p: Producto) => guardar("productos", p),
  guardarVendedora: (v: Vendedora) => guardar("vendedoras", v),
  publicarCampana: (id: number) => pedir<void>("POST", `/campanas/${id}/publicar`),
  cerrarCampana: (id: number) => pedir<void>("POST", `/campanas/${id}/cerrar`),
  calcularComisiones: (campanaId: number) => pedir<void>("POST", `/campanas/${campanaId}/comisiones`),
  aprobarComisiones: (campanaId: number) => pedir<void>("POST", `/campanas/${campanaId}/comisiones/aprobar`),
  enviarPedido: (cliente: string, lineas: LineaCarrito[]) => pedir<{ numero: string }>("POST", "/pedidos", { cliente, lineas }),
  accionPedido: (id: number, accion: "facturar" | "despachar" | "entregar" | "cancelar", dato?: string) =>
    pedir<void>("POST", `/pedidos/${id}/${accion}`, { dato }),
  registrarMovimiento: (productoId: number, tipo: "ENTRADA" | "AJUSTE", cantidad: number, referencia: string) =>
    pedir<void>("POST", "/inventario/movimientos", { productoId, tipo, cantidad, referencia }),
};
