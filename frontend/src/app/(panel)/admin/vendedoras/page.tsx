"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { hoy, subtotalPedido } from "@/lib/negocio";
import { fecha, iniciales, rd } from "@/lib/format";
import type { Vendedora } from "@/lib/types";
import { Cabecera, Chip, Dialogo } from "@/components/ui";

const zonas = ["Distrito Nacional", "Santo Domingo Este", "Santiago", "La Romana", "San Cristóbal", "Puerto Plata"];
const nueva = (): Vendedora => ({ id: 0, usuarioId: null, codigo: "", nombre: "", cedula: "", telefono: "", zona: zonas[0], fechaIngreso: hoy(), estado: "ACTIVA" });
const cedulaValida = (c: string) => /^\d{3}-\d{7}-\d$/.test(c);

export default function Vendedoras() {
  const { vendedoras, pedidos, campanaVigente, guardarVendedora } = useStore();
  const [zona, setZona] = useState("");
  const [form, setForm] = useState<Vendedora | null>(null);

  const lista = vendedoras.filter((v) => !zona || v.zona === zona);
  const cedulaRepetida = form && vendedoras.some((v) => v.cedula === form.cedula && v.id !== form.id);
  const valido = form && form.nombre.trim() && cedulaValida(form.cedula) && !cedulaRepetida && form.telefono.trim();

  return (
    <>
      <Cabecera titulo="Vendedoras" detalle="La red de vendedoras independientes, su zona y sus ventas en la campaña vigente.">
        <button className="btn btn-primario" onClick={() => setForm(nueva())}>Registrar vendedora</button>
      </Cabecera>

      <div className="chips" style={{ marginBottom: 16 }} role="group" aria-label="Zona">
        <button className="chip" aria-pressed={!zona} onClick={() => setZona("")}>Todas las zonas</button>
        {zonas.map((z) => <button key={z} className="chip" aria-pressed={zona === z} onClick={() => setZona(z)}>{z}</button>)}
      </div>

      <div className="hoja tabla-envoltura">
        <table className="tabla">
          <thead><tr><th>Vendedora</th><th>Cédula</th><th>Teléfono</th><th>Zona</th><th>Desde</th><th className="der">Ventas {campanaVigente?.codigo}</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {lista.map((v) => {
              const ventas = pedidos.filter((p) => p.vendedoraId === v.id && p.campanaId === campanaVigente?.id && p.estado !== "CANCELADO").reduce((s, p) => s + subtotalPedido(p), 0);
              return (
                <tr key={v.id}>
                  <td>
                    <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span className="avatar" style={{ background: "var(--fucsia-claro)", color: "var(--fucsia)" }}>{iniciales(v.nombre)}</span>
                      <span>{v.nombre}<br /><span className="tenue cifra" style={{ fontSize: "0.78rem" }}>{v.codigo}</span></span>
                    </span>
                  </td>
                  <td className="cifra">{v.cedula}</td>
                  <td className="cifra">{v.telefono}</td>
                  <td>{v.zona}</td>
                  <td className="cifra">{fecha(v.fechaIngreso)}</td>
                  <td className="der cifra">{ventas ? rd(ventas) : <span className="tenue">Sin pedidos</span>}</td>
                  <td>{v.estado === "ACTIVA" ? <Chip tipo="ok">Activa</Chip> : v.estado === "SUSPENDIDA" ? <Chip tipo="alerta">Suspendida</Chip> : <Chip tipo="neutro">Inactiva</Chip>}</td>
                  <td className="der"><button className="btn btn-chico" onClick={() => setForm(v)}>Editar</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialogo
        titulo={form?.id ? `Editar ${form.codigo}` : "Registrar vendedora"}
        abierto={!!form}
        alCerrar={() => setForm(null)}
        pie={
          <>
            <button className="btn" onClick={() => setForm(null)}>Cancelar</button>
            <button className="btn btn-primario" disabled={!valido} onClick={() => { guardarVendedora({ ...form!, nombre: form!.nombre.trim() }); setForm(null); }}>Guardar vendedora</button>
          </>
        }
      >
        {form && (
          <div className="rejilla-form">
            <label className="campo ancho">
              Nombre completo
              <input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </label>
            <label className="campo">
              Cédula
              <input className="input cifra" value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} placeholder="000-0000000-0" />
              {form.cedula && !cedulaValida(form.cedula) && <span style={{ color: "var(--rojo)", fontWeight: 400 }}>Usa el formato 000-0000000-0.</span>}
              {cedulaRepetida && <span style={{ color: "var(--rojo)", fontWeight: 400 }}>Esa cédula ya está registrada.</span>}
            </label>
            <label className="campo">
              Teléfono
              <input className="input cifra" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="809-555-0000" />
            </label>
            <label className="campo">
              Zona
              <select className="select" value={form.zona} onChange={(e) => setForm({ ...form, zona: e.target.value })}>
                {zonas.map((z) => <option key={z}>{z}</option>)}
              </select>
            </label>
            <label className="campo">
              Estado
              <select className="select" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as Vendedora["estado"] })}>
                <option value="ACTIVA">Activa</option>
                <option value="SUSPENDIDA">Suspendida</option>
                <option value="INACTIVA">Inactiva</option>
              </select>
            </label>
          </div>
        )}
      </Dialogo>
    </>
  );
}
