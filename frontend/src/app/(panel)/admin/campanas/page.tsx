"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { subtotalPedido } from "@/lib/negocio";
import { fecha, rd } from "@/lib/format";
import type { EstadoCampana } from "@/lib/types";
import { Cabecera, Chip, Dialogo } from "@/components/ui";

const etiqueta: Record<EstadoCampana, [string, "ok" | "alerta" | "neutro"]> = {
  PUBLICADA: ["Publicada", "ok"],
  BORRADOR: ["En preparación", "alerta"],
  CERRADA: ["Cerrada", "neutro"],
};

export default function Campanas() {
  const { campanas, pedidos, productos, catalogo, publicarCampana, cerrarCampana } = useStore();
  const [publicar, setPublicar] = useState<number | null>(null);
  const vigente = campanas.find((c) => c.estado === "PUBLICADA");
  const aPublicar = campanas.find((c) => c.id === publicar);

  return (
    <>
      <Cabecera titulo="Campañas" detalle="Cada campaña dura tres semanas. Solo una puede estar publicada; al publicar la siguiente, la anterior se cierra." />

      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 14 }}>
        {[...campanas].reverse().map((c) => {
          const items = catalogo.filter((i) => i.campanaId === c.id && productos.find((p) => p.id === i.productoId)?.activo);
          const ps = pedidos.filter((p) => p.campanaId === c.id && p.estado !== "CANCELADO");
          const [texto, tipo] = etiqueta[c.estado];
          return (
            <li key={c.id} className="hoja campana-fila" style={{ borderLeft: c.estado === "PUBLICADA" ? "4px solid var(--fucsia)" : undefined }}>
              <span className="cifra" style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: "2.6rem", lineHeight: 1, letterSpacing: "-0.05em", color: c.estado === "PUBLICADA" ? "var(--fucsia)" : "var(--tinta-3)", minWidth: 64 }}>
                {c.numero}
              </span>
              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <h2>{c.nombre}</h2>
                  <Chip tipo={tipo}>{texto}</Chip>
                </div>
                <p className="suave cifra" style={{ marginTop: 4, fontSize: "0.9rem" }}>
                  {c.codigo}, del {fecha(c.fechaInicio)} al {fecha(c.fechaFin)}. {items.length} productos en catálogo, {items.filter((i) => i.precioOferta).length} en oferta.
                  {c.estado !== "BORRADOR" && ` ${ps.length} pedidos por ${rd(ps.reduce((s, p) => s + subtotalPedido(p), 0))}.`}
                </p>
              </div>
              <div className="campana-acciones">
                {c.estado === "BORRADOR" && <button className="btn btn-primario" onClick={() => setPublicar(c.id)}>Publicar catálogo</button>}
                {c.estado === "PUBLICADA" && <button className="btn" onClick={() => cerrarCampana(c.id)}>Cerrar campaña</button>}
              </div>
            </li>
          );
        })}
      </ol>

      <Dialogo
        titulo={`¿Publicar la campaña ${aPublicar?.codigo}?`}
        abierto={!!aPublicar}
        alCerrar={() => setPublicar(null)}
        pie={
          <>
            <button className="btn" onClick={() => setPublicar(null)}>Cancelar</button>
            <button className="btn btn-primario" onClick={() => { publicarCampana(publicar!); setPublicar(null); }}>Publicar catálogo</button>
          </>
        }
      >
        <p>
          Las vendedoras verán el catálogo “{aPublicar?.nombre}” y podrán registrar pedidos desde ahora.
          {vigente && ` La campaña ${vigente.codigo} se cerrará y no aceptará más pedidos.`}
        </p>
      </Dialogo>
    </>
  );
}
