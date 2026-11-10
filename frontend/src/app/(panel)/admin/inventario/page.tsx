"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { fechaHora, num } from "@/lib/format";
import { Cabecera, Chip, Dialogo, Muestra } from "@/components/ui";

export default function Inventario() {
  const { existencias, productos, categorias, movimientos, registrarMovimiento } = useStore();
  const [soloAlertas, setSoloAlertas] = useState(false);
  const [form, setForm] = useState<{ productoId: number; tipo: "ENTRADA" | "AJUSTE"; cantidad: string; referencia: string } | null>(null);

  const filas = existencias
    .map((e) => ({ ...e, producto: productos.find((p) => p.id === e.productoId)!, disponible: e.existencia - e.reservado }))
    .filter((f) => f.producto)
    .filter((f) => !soloAlertas || f.disponible <= f.minimo)
    .sort((a, b) => a.producto.sku.localeCompare(b.producto.sku));

  const cantidad = Number(form?.cantidad);
  const valido = form && Number.isInteger(cantidad) && cantidad !== 0 && (form.tipo === "AJUSTE" || cantidad > 0) && form.referencia.trim();

  return (
    <>
      <Cabecera titulo="Inventario" detalle="Las unidades se reservan cuando la vendedora envía el pedido y salen del almacén al despacharlo.">
        <button className="btn btn-primario" onClick={() => setForm({ productoId: productos[0].id, tipo: "ENTRADA", cantidad: "", referencia: "" })}>
          Registrar movimiento
        </button>
      </Cabecera>

      <div className="chips" style={{ marginBottom: 16 }}>
        <button className="chip" aria-pressed={!soloAlertas} onClick={() => setSoloAlertas(false)}>Todos los productos</button>
        <button className="chip" aria-pressed={soloAlertas} onClick={() => setSoloAlertas(true)}>
          Bajo el mínimo <span className="cifra" style={{ opacity: 0.6 }}>{existencias.filter((e) => e.existencia - e.reservado <= e.minimo).length}</span>
        </button>
      </div>

      <div className="dos-col">
        <div className="hoja tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr><th>Producto</th><th className="der">En almacén</th><th className="der">Reservado</th><th className="der">Disponible</th><th className="der">Mínimo</th><th>Situación</th></tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.productoId}>
                  <td>
                    <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Muestra producto={f.producto} mini />
                      <span>
                        {f.producto.nombre}
                        <br />
                        <span className="tenue cifra" style={{ fontSize: "0.78rem" }}>{f.producto.sku}, {categorias.find((c) => c.id === f.producto.categoriaId)?.nombre}</span>
                      </span>
                    </span>
                  </td>
                  <td className="der cifra">{num(f.existencia)}</td>
                  <td className="der cifra">{num(f.reservado)}</td>
                  <td className="der cifra" style={{ fontWeight: 700 }}>{num(f.disponible)}</td>
                  <td className="der cifra tenue">{num(f.minimo)}</td>
                  <td>
                    {f.disponible <= 0 ? <Chip tipo="critico">Agotado</Chip> : f.disponible <= f.minimo ? <Chip tipo="alerta">Reponer</Chip> : <Chip tipo="ok">Suficiente</Chip>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="hoja">
          <div className="hoja-titulo"><h2>Últimos movimientos</h2></div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {movimientos.slice(0, 12).map((m) => {
              const p = productos.find((x) => x.id === m.productoId);
              const signo = m.tipo === "ENTRADA" ? "+" : m.tipo === "AJUSTE" ? (m.cantidad > 0 ? "+" : "") : "−";
              return (
                <li key={m.id} style={{ padding: "11px 20px", borderBottom: "1px solid var(--linea)", display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 12px", fontSize: "0.88rem" }}>
                  <span style={{ fontWeight: 600 }}>{p?.nombre}</span>
                  <strong className="cifra" style={{ color: m.tipo === "ENTRADA" ? "var(--jade)" : "var(--tinta)" }}>{signo}{Math.abs(m.cantidad)}</strong>
                  <span className="tenue">{m.referencia}</span>
                  <span className="tenue cifra" style={{ fontSize: "0.78rem" }}>{fechaHora(m.fecha)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <Dialogo
        titulo="Registrar movimiento"
        abierto={!!form}
        alCerrar={() => setForm(null)}
        pie={
          <>
            <button className="btn" onClick={() => setForm(null)}>Cancelar</button>
            <button className="btn btn-primario" disabled={!valido} onClick={() => { registrarMovimiento(form!.productoId, form!.tipo, cantidad, form!.referencia.trim()); setForm(null); }}>
              Registrar {form?.tipo === "ENTRADA" ? "entrada" : "ajuste"}
            </button>
          </>
        }
      >
        {form && (
          <div className="rejilla-form">
            <label className="campo ancho">
              Producto
              <select className="select" value={form.productoId} onChange={(e) => setForm({ ...form, productoId: Number(e.target.value) })}>
                {productos.map((p) => <option key={p.id} value={p.id}>{p.sku}: {p.nombre}</option>)}
              </select>
            </label>
            <label className="campo">
              Tipo
              <select className="select" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as "ENTRADA" | "AJUSTE" })}>
                <option value="ENTRADA">Entrada de mercancía</option>
                <option value="AJUSTE">Ajuste por conteo</option>
              </select>
            </label>
            <label className="campo">
              Cantidad
              <input className="input cifra" inputMode="numeric" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} placeholder={form.tipo === "AJUSTE" ? "Usa negativo para restar" : "Unidades recibidas"} />
            </label>
            <label className="campo ancho">
              Referencia
              <input className="input" value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} placeholder="Ej.: Recepción OC-2026-121" />
            </label>
          </div>
        )}
      </Dialogo>
    </>
  );
}
