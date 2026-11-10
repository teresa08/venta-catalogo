"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { EstadoPedido, Producto } from "@/lib/types";
import { etiquetaEstado } from "@/lib/format";

export function Cabecera({ titulo, detalle, children }: { titulo: string; detalle?: ReactNode; children?: ReactNode }) {
  return (
    <header className="cabecera">
      <div>
        <h1>{titulo}</h1>
        {detalle && <p>{detalle}</p>}
      </div>
      {children && <div className="cabecera-acciones">{children}</div>}
    </header>
  );
}

export function EstadoPedidoChip({ estado }: { estado: EstadoPedido }) {
  return <span className={`estado estado-${estado}`}>{etiquetaEstado[estado]}</span>;
}

export function Chip({ tipo, children }: { tipo: "ok" | "alerta" | "critico" | "neutro"; children: ReactNode }) {
  return <span className={`estado estado-${tipo}`}>{children}</span>;
}

function sigla(nombre: string) {
  return nombre
    .replace(/\(.*?\)|\d+\s?(ml|g|u\.)/gi, "")
    .split(" ")
    .filter((w) => w.length > 3)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function Muestra({ producto, mini = false }: { producto: Producto; mini?: boolean }) {
  const fondo = `linear-gradient(140deg, ${producto.tono} 0%, ${producto.tono} 55%, color-mix(in srgb, ${producto.tono} 70%, #241b35) 100%)`;
  if (mini) return <span className="muestra-mini" style={{ background: fondo }} aria-hidden />;
  return (
    <div className="muestra" style={{ background: fondo }} aria-hidden>
      <span className="muestra-sigla">{sigla(producto.nombre)}</span>
    </div>
  );
}

export function Dialogo({
  titulo,
  subtitulo,
  abierto,
  alCerrar,
  pie,
  ancho,
  children,
}: {
  titulo: string;
  subtitulo?: ReactNode;
  abierto: boolean;
  alCerrar: () => void;
  pie?: ReactNode;
  ancho?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const previo = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("input, select, textarea, button:not(.cerrar)")?.focus();
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && alCerrar();
    window.addEventListener("keydown", tecla);
    return () => {
      window.removeEventListener("keydown", tecla);
      previo?.focus();
    };
  }, [abierto, alCerrar]);

  if (!abierto) return null;
  return (
    <div className="velo" onMouseDown={(e) => e.target === e.currentTarget && alCerrar()}>
      <div ref={ref} className={`dialogo ${ancho ? "dialogo-ancho" : ""}`} role="dialog" aria-modal="true" aria-label={titulo}>
        <header>
          <div>
            <h2>{titulo}</h2>
            {subtitulo && <p className="tenue" style={{ marginTop: 4, fontSize: "0.88rem" }}>{subtitulo}</p>}
          </div>
          <button className="cerrar" onClick={alCerrar} aria-label="Cerrar">×</button>
        </header>
        <div className="cuerpo">{children}</div>
        {pie && <footer>{pie}</footer>}
      </div>
    </div>
  );
}
