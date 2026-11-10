"use client";

import { ITBIS, subtotalPedido } from "@/lib/negocio";
import { etiquetaEstado, fechaHora, rd } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { EstadoPedido, Pedido } from "@/lib/types";
import { Muestra } from "./ui";
import { Icono } from "./Icono";

const pasos: EstadoPedido[] = ["ENVIADO", "FACTURADO", "EN_DESPACHO", "ENTREGADO"];
const explicacion: Record<EstadoPedido, string> = {
  ENVIADO: "La administración recibió el pedido",
  FACTURADO: "Factura emitida, en preparación",
  EN_DESPACHO: "Salió con el mensajero",
  ENTREGADO: "Recibido por la vendedora",
  CANCELADO: "El pedido no se procesará",
};

export function Totales({ subtotal }: { subtotal: number }) {
  const itbis = Math.round(subtotal * ITBIS * 100) / 100;
  return (
    <dl className="totales cifra">
      <div><dt>Subtotal</dt><dd>{rd(subtotal)}</dd></div>
      <div><dt>ITBIS (18 %)</dt><dd>{rd(itbis)}</dd></div>
      <div className="total"><dt>Total</dt><dd>{rd(subtotal + itbis)}</dd></div>
    </dl>
  );
}

export function RutaPedido({ pedido }: { pedido: Pedido }) {
  const lista = pedido.estado === "CANCELADO" ? (["ENVIADO", "CANCELADO"] as EstadoPedido[]) : pasos;
  return (
    <ol className="ruta">
      {lista.map((e) => {
        const h = pedido.historial.find((x) => x.estado === e);
        const actual = pedido.estado === e;
        return (
          <li key={e} className={`${h ? "hecho" : ""} ${actual ? "actual" : ""}`}>
            <span className="punto">{h && <Icono nombre="check" />}</span>
            <div>
              <strong>{etiquetaEstado[e]}</strong>
              <span>{h ? `${fechaHora(h.fecha)}. ${h.nota ?? explicacion[e]}` : explicacion[e]}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function LineasPedido({ pedido }: { pedido: Pedido }) {
  const { productos } = useStore();
  return (
    <div className="tabla-envoltura">
      <table className="tabla">
        <thead>
          <tr><th>Producto</th><th className="der">Cant.</th><th className="der">Precio</th><th className="der">Importe</th></tr>
        </thead>
        <tbody>
          {pedido.lineas.map((l) => {
            const p = productos.find((x) => x.id === l.productoId)!;
            return (
              <tr key={l.productoId}>
                <td>
                  <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Muestra producto={p} mini />
                    <span>{p.nombre}<br /><span className="tenue cifra" style={{ fontSize: "0.78rem" }}>{p.sku}</span></span>
                  </span>
                </td>
                <td className="der cifra">{l.cantidad}</td>
                <td className="der cifra">{rd(l.precio)}</td>
                <td className="der cifra">{rd(l.cantidad * l.precio)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Totales subtotal={subtotalPedido(pedido)} />
    </div>
  );
}
