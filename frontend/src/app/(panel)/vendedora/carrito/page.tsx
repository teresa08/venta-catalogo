"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { rd } from "@/lib/format";
import { Cabecera, Dialogo, Muestra } from "@/components/ui";
import { Totales } from "@/components/PedidoDetalle";
import { Icono } from "@/components/Icono";

export default function Carrito() {
  const { carrito, productos, existencias, campanaVigente: c, vendedoraSesion, precioVigente, cambiarCantidad, vaciarCarrito, enviarPedido } = useStore();
  const [cliente, setCliente] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [enviado, setEnviado] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (enviado) {
    return (
      <div className="hoja vacio" style={{ padding: "48px 20px" }}>
        <span className="estado estado-ENVIADO">Enviado</span>
        <h1 style={{ fontSize: "1.6rem" }}>Pedido {enviado} enviado</h1>
        <p>La administración lo facturará y te avisará cuando salga con el mensajero.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <Link className="btn btn-oscuro" href="/vendedora/pedidos">Ver mis pedidos</Link>
          <Link className="btn" href="/vendedora">Seguir en el catálogo</Link>
        </div>
      </div>
    );
  }

  if (!c || carrito.length === 0) {
    return (
      <>
        <Cabecera titulo="Mi pedido" />
        <div className="hoja vacio">
          <p>Tu pedido está vacío. Agrega productos desde el catálogo de la campaña.</p>
          <Link className="btn btn-primario" href="/vendedora">Ir al catálogo</Link>
        </div>
      </>
    );
  }

  const lineas = carrito.map((l) => ({ ...l, producto: productos.find((p) => p.id === l.productoId)!, precio: precioVigente(c.id, l.productoId) }));
  const subtotal = lineas.reduce((s, l) => s + l.cantidad * l.precio, 0);
  const unidades = lineas.reduce((s, l) => s + l.cantidad, 0);

  const enviar = async () => {
    if (!vendedoraSesion) return;
    setEnviando(true);
    const numero = await enviarPedido(cliente);
    setEnviando(false);
    setConfirmar(false);
    if (numero) setEnviado(numero);
  };

  return (
    <>
      <Cabecera titulo="Mi pedido" detalle={`Campaña ${c.codigo}. ${unidades} unidades de ${lineas.length} productos.`}>
        <button className="btn btn-texto btn-peligro" onClick={vaciarCarrito}>Vaciar pedido</button>
      </Cabecera>

      <div className="dos-col">
        <section className="hoja" aria-label="Productos del pedido">
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {lineas.map((l) => {
              const ex = existencias.find((e) => e.productoId === l.productoId);
              const disponible = ex ? ex.existencia - ex.reservado : 0;
              return (
                <li key={l.productoId} className="linea-carrito">
                  <Muestra producto={l.producto} mini />
                  <div className="linea-info">
                    <p style={{ fontWeight: 600 }}>{l.producto.nombre}</p>
                    <p className="tenue cifra" style={{ fontSize: "0.82rem" }}>{rd(l.precio)} c/u</p>
                  </div>
                  <div className="paso" role="group" aria-label={`Cantidad de ${l.producto.nombre}`} style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--linea-fuerte)", borderRadius: 999 }}>
                    <button className="btn btn-texto btn-chico" onClick={() => cambiarCantidad(l.productoId, l.cantidad - 1)} aria-label="Quitar uno"><span style={{ width: 14, display: "grid" }}><Icono nombre="menos" /></span></button>
                    <span className="cifra" style={{ minWidth: 26, textAlign: "center", fontWeight: 700 }}>{l.cantidad}</span>
                    <button className="btn btn-texto btn-chico" disabled={l.cantidad >= disponible} onClick={() => cambiarCantidad(l.productoId, l.cantidad + 1)} aria-label="Agregar uno"><span style={{ width: 14, display: "grid" }}><Icono nombre="mas" /></span></button>
                  </div>
                  <strong className="cifra linea-importe">{rd(l.cantidad * l.precio)}</strong>
                </li>
              );
            })}
          </ul>
          <Totales subtotal={subtotal} />
        </section>

        <aside className="hoja hoja-pad pila">
          <h2>Enviar a la administración</h2>
          <label className="campo">
            Cliente o referencia del pedido
            <input className="input" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ej.: Mildred Santana" />
          </label>
          <p className="suave" style={{ fontSize: "0.88rem" }}>
            Al enviar, las unidades quedan reservadas para ti. Podrás seguir el pedido en “Mis pedidos”.
          </p>
          <button className="btn btn-primario" style={{ minHeight: 44 }} onClick={() => setConfirmar(true)}>
            Enviar pedido
          </button>
        </aside>
      </div>

      <Dialogo
        titulo="¿Enviar este pedido?"
        subtitulo={`${unidades} unidades para ${cliente.trim() || "cliente sin nombre"}`}
        abierto={confirmar}
        alCerrar={() => setConfirmar(false)}
        pie={
          <>
            <button className="btn" onClick={() => setConfirmar(false)}>Seguir editando</button>
            <button className="btn btn-primario" disabled={enviando} onClick={enviar}>{enviando ? "Enviando…" : "Enviar pedido"}</button>
          </>
        }
      >
        <p>Después de enviarlo no podrás cambiar las cantidades. Si necesitas corregir algo, pide a la administración que lo cancele.</p>
      </Dialogo>
    </>
  );
}
