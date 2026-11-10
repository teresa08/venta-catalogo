"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { iniciales } from "@/lib/format";
import { Icono } from "./Icono";

interface Item {
  href: string;
  texto: string;
  icono: string;
  grupo?: string;
}

const menuAdmin: Item[] = [
  { href: "/admin", texto: "Resumen", icono: "resumen" },
  { href: "/admin/pedidos", texto: "Pedidos", icono: "pedido", grupo: "Operación" },
  { href: "/admin/inventario", texto: "Inventario", icono: "inventario" },
  { href: "/admin/campanas", texto: "Campañas", icono: "campana", grupo: "Catálogo" },
  { href: "/admin/productos", texto: "Productos", icono: "producto" },
  { href: "/admin/categorias", texto: "Categorías", icono: "categoria" },
  { href: "/admin/vendedoras", texto: "Vendedoras", icono: "vendedora", grupo: "Red de ventas" },
  { href: "/admin/comisiones", texto: "Comisiones", icono: "comision" },
  { href: "/admin/reportes", texto: "Reportes", icono: "reporte" },
  { href: "/admin/usuarios", texto: "Usuarios y roles", icono: "usuario", grupo: "Seguridad" },
];

const menuVendedora: Item[] = [
  { href: "/vendedora", texto: "Catálogo", icono: "catalogo" },
  { href: "/vendedora/carrito", texto: "Mi pedido", icono: "carrito" },
  { href: "/vendedora/pedidos", texto: "Mis pedidos", icono: "pedido" },
  { href: "/vendedora/cuenta", texto: "Estado de cuenta", icono: "cuenta" },
];

export function Shell({ zona, children }: { zona: "admin" | "vendedora"; children: ReactNode }) {
  const { listo, usuario, carrito, cerrarSesion, aviso } = useStore();
  const ruta = usePathname();
  const router = useRouter();
  const esAdmin = usuario?.rolId === 1;
  const permitido = usuario && (zona === "admin" ? esAdmin : usuario.rolId !== 1);

  useEffect(() => {
    if (listo && !permitido) router.replace("/");
  }, [listo, permitido, router]);

  if (!listo || !permitido || !usuario) return null;

  // El cliente final solo consulta el catálogo.
  const menu = zona === "admin" ? menuAdmin : usuario.rolId === 3 ? menuVendedora.slice(0, 1) : menuVendedora;
  const activo = (href: string) => (href === "/admin" || href === "/vendedora" ? ruta === href : ruta.startsWith(href));
  const enCarrito = carrito.reduce((s, l) => s + l.cantidad, 0);

  const salir = () => {
    cerrarSesion();
    router.replace("/");
  };

  return (
    <div className="panel">
      <aside className="lateral">
        <Link href={menu[0].href} className="marca">
          <span className="marca-sello">vc</span>
          <span className="marca-nombre">
            Venta por Catálogo
            <small>{zona === "admin" ? "Administración" : "Portal de la vendedora"}</small>
          </span>
        </Link>
        <nav className="nav" aria-label="Principal">
          {menu.map((m) => (
            <div key={m.href} style={{ display: "contents" }}>
              {m.grupo && <div className="nav-grupo">{m.grupo}</div>}
              <Link href={m.href} aria-current={activo(m.href) ? "page" : undefined}>
                <Icono nombre={m.icono} />
                <span style={{ flex: 1 }}>{m.texto}</span>
                {m.icono === "carrito" && enCarrito > 0 && <span className="contador">{enCarrito}</span>}
              </Link>
            </div>
          ))}
        </nav>
        <div className="nav-cuenta">
          <span className="avatar">{iniciales(usuario.nombre)}</span>
          <div className="quien">
            {usuario.nombre}
            <span>{esAdmin ? "Administración" : "Vendedora"}</span>
          </div>
          <button onClick={salir} aria-label="Cerrar sesión" title="Cerrar sesión" style={{ width: 32, height: 32 }}>
            <Icono nombre="salir" />
          </button>
        </div>
      </aside>

      <div className="barra-movil">
        <Link href={menu[0].href} className="marca" style={{ padding: 0 }}>
          <span className="marca-sello" style={{ width: 32, height: 32, fontSize: "0.9rem" }}>vc</span>
          <span className="marca-nombre" style={{ fontSize: "0.95rem" }}>Venta por Catálogo</span>
        </Link>
        <button className="btn btn-chico" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,.3)" }} onClick={salir}>
          Salir
        </button>
      </div>

      <main className="contenido">{children}</main>

      <nav className="tabs-movil" aria-label="Principal (móvil)">
        {menu.map((m) => (
          <Link key={m.href} href={m.href} aria-current={activo(m.href) ? "page" : undefined}>
            <Icono nombre={m.icono} />
            {m.texto}
            {m.icono === "carrito" && enCarrito > 0 && <span className="contador">{enCarrito}</span>}
          </Link>
        ))}
      </nav>

      {aviso && (
        <div className="aviso" role="status">
          {aviso}
        </div>
      )}
    </div>
  );
}
