"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { ITBIS, subtotalPedido } from "@/lib/negocio";
import { fecha, rd } from "@/lib/format";
import { Cabecera, Dialogo, EstadoPedidoChip } from "@/components/ui";
import { LineasPedido, RutaPedido } from "@/components/PedidoDetalle";

export default function MisPedidos() {
  const { pedidos, campanas, vendedoraSesion } = useStore();
  const [abierto, setAbierto] = useState<number | null>(null);
  const mios = pedidos.filter((p) => p.vendedoraId === vendedoraSesion?.id).sort((a, b) => b.id - a.id);
  const sel = mios.find((p) => p.id === abierto);
  const activos = mios.filter((p) => p.estado !== "ENTREGADO" && p.estado !== "CANCELADO").length;

  return (
    <>
      <Cabecera
        titulo="Mis pedidos"
        detalle={activos ? `Tienes ${activos} pedidos en proceso. Toca uno para ver por dónde va.` : "Todos tus pedidos fueron entregados."}
      />
      {mios.length === 0 ? (
        <div className="hoja vacio"><p>Aún no has enviado pedidos.</p></div>
      ) : (
        <div className="hoja tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr><th>Pedido</th><th>Campaña</th><th>Cliente</th><th>Enviado</th><th>Estado</th><th className="der">Total</th></tr>
            </thead>
            <tbody>
              {mios.map((p) => (
                <tr key={p.id} className="clic" onClick={() => setAbierto(p.id)}>
                  <td>
                    <button className="btn-texto" style={{ border: 0, background: "none", padding: 0, fontWeight: 600, cursor: "pointer" }} onClick={() => setAbierto(p.id)}>
                      {p.numero}
                    </button>
                  </td>
                  <td>{campanas.find((c) => c.id === p.campanaId)?.codigo}</td>
                  <td>{p.cliente}</td>
                  <td className="cifra">{fecha(p.historial[0].fecha)}</td>
                  <td><EstadoPedidoChip estado={p.estado} /></td>
                  <td className="der cifra">{rd(subtotalPedido(p) * (1 + ITBIS))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialogo ancho titulo={sel ? `Pedido ${sel.numero}` : ""} subtitulo={sel && `Cliente: ${sel.cliente}`} abierto={!!sel} alCerrar={() => setAbierto(null)}>
        {sel && (
          <div className="pila">
            <RutaPedido pedido={sel} />
            {sel.despacho && (
              <p className="suave" style={{ fontSize: "0.88rem" }}>
                Mensajero: {sel.despacho.mensajero}. Guía {sel.despacho.guia}.
              </p>
            )}
            <div className="hoja"><LineasPedido pedido={sel} /></div>
          </div>
        )}
      </Dialogo>
    </>
  );
}
