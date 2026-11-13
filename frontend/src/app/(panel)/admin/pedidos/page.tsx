"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { ITBIS, subtotalPedido } from "@/lib/negocio";
import { etiquetaEstado, fecha, fechaHora, rd } from "@/lib/format";
import type { EstadoPedido } from "@/lib/types";
import { Cabecera, Dialogo, EstadoPedidoChip } from "@/components/ui";
import { LineasPedido, RutaPedido } from "@/components/PedidoDetalle";

const filtrosEstado: (EstadoPedido | "TODOS")[] = ["TODOS", "ENVIADO", "FACTURADO", "EN_DESPACHO", "ENTREGADO", "CANCELADO"];
const mensajeros = ["Domingo Cuevas", "Starlin Rosario", "Franklin Medina"];

function Pedidos() {
  const { pedidos, campanas, vendedoras, campanaVigente, facturarPedido, despacharPedido, confirmarEntrega, cancelarPedido } = useStore();
  const params = useSearchParams();
  const [estado, setEstado] = useState<EstadoPedido | "TODOS">("TODOS");
  const [campana, setCampana] = useState<number | 0>(campanaVigente?.id ?? 0);
  const [q, setQ] = useState("");
  const [abierto, setAbierto] = useState<number | null>(null);
  const [mensajero, setMensajero] = useState(mensajeros[0]);
  const [cancelando, setCancelando] = useState(false);
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    const id = Number(params.get("id"));
    if (id) setAbierto(id);
  }, [params]);

  const lista = pedidos
    .filter((p) => estado === "TODOS" || p.estado === estado)
    .filter((p) => !campana || p.campanaId === campana)
    .filter((p) => {
      const t = q.trim().toLowerCase();
      if (!t) return true;
      const v = vendedoras.find((x) => x.id === p.vendedoraId);
      return p.numero.toLowerCase().includes(t) || p.cliente.toLowerCase().includes(t) || v?.nombre.toLowerCase().includes(t);
    })
    .sort((a, b) => b.id - a.id);

  const sel = pedidos.find((p) => p.id === abierto);
  const cerrar = () => {
    setAbierto(null);
    setCancelando(false);
    setMotivo("");
  };

  const conteo = (e: EstadoPedido | "TODOS") =>
    pedidos.filter((p) => (!campana || p.campanaId === campana) && (e === "TODOS" || p.estado === e)).length;

  return (
    <>
      <Cabecera titulo="Pedidos" detalle="Factura los pedidos enviados por las vendedoras, despáchalos y confirma la entrega." />

      <div className="filtros">
        <input className="input" type="search" placeholder="Busca por número, cliente o vendedora" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar pedidos" />
        <select className="select" value={campana} onChange={(e) => setCampana(Number(e.target.value))} aria-label="Campaña">
          <option value={0}>Todas las campañas</option>
          {campanas.map((c) => <option key={c.id} value={c.id}>{c.codigo}</option>)}
        </select>
      </div>
      <div className="chips" role="group" aria-label="Estado" style={{ marginBottom: 16 }}>
        {filtrosEstado.map((e) => (
          <button key={e} className="chip" aria-pressed={estado === e} onClick={() => setEstado(e)}>
            {e === "TODOS" ? "Todos" : etiquetaEstado[e]} <span className="cifra" style={{ opacity: 0.6 }}>{conteo(e)}</span>
          </button>
        ))}
      </div>

      <div className="hoja tabla-envoltura">
        <table className="tabla">
          <thead>
            <tr><th>Pedido</th><th>Vendedora</th><th>Cliente</th><th>Enviado</th><th>Estado</th><th className="der">Total con ITBIS</th></tr>
          </thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.id} className="clic" onClick={() => setAbierto(p.id)}>
                <td>
                  <button style={{ border: 0, background: "none", padding: 0, fontWeight: 600, cursor: "pointer" }} onClick={() => setAbierto(p.id)}>{p.numero}</button>
                  <div className="tenue" style={{ fontSize: "0.78rem" }}>{campanas.find((c) => c.id === p.campanaId)?.codigo}</div>
                </td>
                <td>{vendedoras.find((v) => v.id === p.vendedoraId)?.nombre}</td>
                <td>{p.cliente}</td>
                <td className="cifra">{fecha(p.historial[0].fecha)}</td>
                <td><EstadoPedidoChip estado={p.estado} /></td>
                <td className="der cifra">{rd(subtotalPedido(p) * (1 + ITBIS))}</td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr><td colSpan={6}><div className="vacio"><p>No hay pedidos con estos filtros.</p></div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialogo
        ancho
        abierto={!!sel}
        alCerrar={cerrar}
        titulo={sel ? `Pedido ${sel.numero}` : ""}
        subtitulo={sel && `${vendedoras.find((v) => v.id === sel.vendedoraId)?.nombre}, para ${sel.cliente}`}
        pie={
          sel && (
            cancelando ? (
              <>
                <button className="btn" onClick={() => setCancelando(false)}>Volver</button>
                <button className="btn btn-oscuro" disabled={!motivo.trim()} onClick={() => { cancelarPedido(sel.id, motivo.trim()); cerrar(); }}>Cancelar pedido</button>
              </>
            ) : (
              <>
                {(sel.estado === "ENVIADO" || sel.estado === "FACTURADO") && (
                  <button className="btn btn-texto btn-peligro" style={{ marginRight: "auto" }} onClick={() => setCancelando(true)}>Cancelar pedido</button>
                )}
                {sel.estado === "ENVIADO" && <button className="btn btn-primario" onClick={() => facturarPedido(sel.id)}>Facturar pedido</button>}
                {sel.estado === "FACTURADO" && (
                  <>
                    <select className="select" style={{ width: "auto" }} value={mensajero} onChange={(e) => setMensajero(e.target.value)} aria-label="Mensajero">
                      {mensajeros.map((m) => <option key={m}>{m}</option>)}
                    </select>
                    <button className="btn btn-primario" onClick={() => despacharPedido(sel.id, mensajero)}>Despachar pedido</button>
                  </>
                )}
                {sel.estado === "EN_DESPACHO" && <button className="btn btn-primario" onClick={() => confirmarEntrega(sel.id)}>Confirmar entrega</button>}
                {(sel.estado === "ENTREGADO" || sel.estado === "CANCELADO") && <button className="btn" onClick={cerrar}>Cerrar</button>}
              </>
            )
          )
        }
      >
        {sel && (
          cancelando ? (
            <label className="campo">
              Motivo de la cancelación
              <textarea className="textarea" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej.: la vendedora pidió anularlo" />
              <span className="tenue" style={{ fontWeight: 400 }}>Las unidades reservadas vuelven al inventario disponible.</span>
            </label>
          ) : (
            <div className="pila">
              <div className="dos-col dos-igual" style={{ gap: 16 }}>
                <RutaPedido pedido={sel} />
                <div className="pila" style={{ gap: 6, alignContent: "start", fontSize: "0.88rem" }}>
                  <p className="suave">{sel.factura ? `Factura ${sel.factura.numero}, ${fechaHora(sel.factura.fecha)}.` : "Aún sin factura."}</p>
                  {sel.despacho && <p className="suave">Despacho con {sel.despacho.mensajero}, guía {sel.despacho.guia}.</p>}
                </div>
              </div>
              <div className="hoja"><LineasPedido pedido={sel} /></div>
            </div>
          )
        )}
      </Dialogo>
    </>
  );
}

export default function Pagina() {
  return (
    <Suspense>
      <Pedidos />
    </Suspense>
  );
}
