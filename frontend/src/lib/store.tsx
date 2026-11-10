"use client";

// Estado de la interfaz. Los datos vienen del API (/api/estado); cada acción llama al API y vuelve a cargar.
// Solo el carrito vive en el navegador hasta que la vendedora envía el pedido.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ErrorApi, token, type EstadoVisible } from "./api";
import { precioVigente as precioDe } from "@/server/domain/reglas";
import type { Campana, Categoria, LineaCarrito, Producto, Usuario, Vendedora } from "./types";

const vacio: EstadoVisible = {
  sesionId: null,
  roles: [],
  categorias: [],
  productos: [],
  campanas: [],
  catalogo: [],
  nivelesComision: [],
};

const CLAVE_CARRITO = "venta-catalogo:carrito";

function leerCarrito(): LineaCarrito[] {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_CARRITO) ?? "[]");
  } catch {
    return [];
  }
}

function useDatos() {
  const [estado, setEstado] = useState<EstadoVisible>(vacio);
  const [carrito, setCarrito] = useState<LineaCarrito[]>([]);
  const [listo, setListo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setEstado(await api.estado());
    } catch (e) {
      if (e instanceof ErrorApi && e.status === 401) {
        token.guardar(null);
        setEstado(await api.estado().catch(() => vacio));
      } else {
        setAviso(e instanceof Error ? e.message : "No se pudo conectar con el servidor");
      }
    }
  }, []);

  useEffect(() => {
    setCarrito(leerCarrito());
    cargar().finally(() => setListo(true));
  }, [cargar]);

  useEffect(() => {
    if (!listo) return;
    try {
      localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
    } catch {
      /* ignorar */
    }
  }, [carrito, listo]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 3600);
    return () => clearTimeout(t);
  }, [aviso]);

  /** Ejecuta una llamada al API, recarga el estado y muestra el aviso. Devuelve false si falló. */
  const accion = useCallback(
    async (llamada: () => Promise<unknown>, exito: string): Promise<boolean> => {
      try {
        await llamada();
        await cargar();
        setAviso(exito);
        return true;
      } catch (e) {
        setAviso(e instanceof Error ? e.message : "No se pudo completar la acción");
        if (e instanceof ErrorApi && e.status === 401) await cargar();
        return false;
      }
    },
    [cargar],
  );

  return { estado, carrito, setCarrito, listo, aviso, setAviso, cargar, accion };
}

function useAcciones(d: ReturnType<typeof useDatos>) {
  const { accion, cargar, setCarrito, setAviso, carrito } = d;
  return useMemo(
    () => ({
      // CU010: devuelve el mensaje de error o null si entró.
      iniciarSesion: async (email: string, clave: string): Promise<string | null> => {
        try {
          const r = await api.login(email, clave);
          token.guardar(r.token);
          await cargar();
          return null;
        } catch (e) {
          return e instanceof Error ? e.message : "No se pudo iniciar sesión";
        }
      },
      cerrarSesion: () => {
        token.guardar(null);
        setCarrito([]);
        void cargar();
      },

      guardarUsuario: (u: Usuario & { clave?: string }) => accion(() => api.guardarUsuario(u), "Usuario guardado"),
      guardarCategoria: (c: Categoria) => accion(() => api.guardarCategoria(c), "Categoría guardada"),
      guardarProducto: (p: Producto) => accion(() => api.guardarProducto(p), "Producto guardado"),
      guardarVendedora: (v: Vendedora) => accion(() => api.guardarVendedora(v), "Vendedora guardada"),

      publicarCampana: (id: number) => accion(() => api.publicarCampana(id), "Campaña publicada. La campaña anterior quedó cerrada."),
      cerrarCampana: (id: number) => accion(() => api.cerrarCampana(id), "Campaña cerrada"),

      // CU040: el carrito es local
      agregarAlCarrito: (productoId: number, cantidad = 1) =>
        setCarrito((c) => {
          const linea = c.find((l) => l.productoId === productoId);
          return linea
            ? c.map((l) => (l.productoId === productoId ? { ...l, cantidad: l.cantidad + cantidad } : l))
            : [...c, { productoId, cantidad }];
        }),
      cambiarCantidad: (productoId: number, cantidad: number) =>
        setCarrito((c) =>
          cantidad <= 0 ? c.filter((l) => l.productoId !== productoId) : c.map((l) => (l.productoId === productoId ? { ...l, cantidad } : l)),
        ),
      vaciarCarrito: () => setCarrito([]),

      // CU045: devuelve el número del pedido o null si falló.
      enviarPedido: async (cliente: string): Promise<string | null> => {
        try {
          const { numero } = await api.enviarPedido(cliente, carrito);
          setCarrito([]);
          await cargar();
          return numero;
        } catch (e) {
          setAviso(e instanceof Error ? e.message : "No se pudo enviar el pedido");
          return null;
        }
      },

      facturarPedido: (id: number) => accion(() => api.accionPedido(id, "facturar"), "Pedido facturado"),
      despacharPedido: (id: number, mensajero: string) => accion(() => api.accionPedido(id, "despachar", mensajero), "Pedido despachado"),
      confirmarEntrega: (id: number) => accion(() => api.accionPedido(id, "entregar"), "Entrega confirmada"),
      cancelarPedido: (id: number, motivo: string) => accion(() => api.accionPedido(id, "cancelar", motivo), "Pedido cancelado y existencias liberadas"),

      registrarMovimiento: (productoId: number, tipo: "ENTRADA" | "AJUSTE", cantidad: number, referencia: string) =>
        accion(() => api.registrarMovimiento(productoId, tipo, cantidad, referencia), tipo === "ENTRADA" ? "Entrada registrada" : "Ajuste registrado"),

      calcularComisiones: (campanaId: number) => accion(() => api.calcularComisiones(campanaId), "Comisiones calculadas"),
      aprobarComisiones: (campanaId: number) => accion(() => api.aprobarComisiones(campanaId), "Liquidación aprobada"),
    }),
    [accion, cargar, setCarrito, setAviso, carrito],
  );
}

type Acciones = ReturnType<typeof useAcciones>;

type Contexto = Required<Omit<EstadoVisible, "sesionId">> &
  Acciones & {
    listo: boolean;
    aviso: string | null;
    carrito: LineaCarrito[];
    usuario: Usuario | null;
    vendedoraSesion: Vendedora | null;
    campanaVigente: Campana | undefined;
    precioVigente: (campanaId: number, productoId: number) => number;
  };

const Ctx = createContext<Contexto | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const d = useDatos();
  const acciones = useAcciones(d);
  const e = d.estado;

  const usuarios = e.usuarios ?? [];
  const vendedoras = e.vendedoras ?? [];
  const usuario = usuarios.find((u) => u.id === e.sesionId) ?? null;

  const valor: Contexto = {
    ...acciones,
    roles: e.roles,
    categorias: e.categorias,
    productos: e.productos,
    campanas: e.campanas,
    catalogo: e.catalogo,
    nivelesComision: e.nivelesComision,
    usuarios,
    vendedoras,
    existencias: e.existencias ?? [],
    movimientos: e.movimientos ?? [],
    pedidos: e.pedidos ?? [],
    comisiones: e.comisiones ?? [],
    pagos: e.pagos ?? [],
    carrito: d.carrito,
    listo: d.listo,
    aviso: d.aviso,
    usuario,
    vendedoraSesion: usuario ? vendedoras.find((v) => v.usuarioId === usuario.id) ?? null : null,
    campanaVigente: e.campanas.find((c) => c.estado === "PUBLICADA"),
    precioVigente: (campanaId, productoId) =>
      precioDe(
        e.catalogo.find((i) => i.campanaId === campanaId && i.productoId === productoId),
        e.productos.find((p) => p.id === productoId)?.precioBase ?? 0,
      ),
  };

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore debe usarse dentro de StoreProvider");
  return c;
}
