"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { rd } from "@/lib/format";
import type { Producto } from "@/lib/types";
import { Cabecera, Chip, Dialogo, Muestra } from "@/components/ui";

const nuevo = (categoriaId: number): Producto => ({ id: 0, sku: "", nombre: "", descripcion: "", categoriaId, precioBase: 0, activo: true, tono: "#b3125a" });

export default function Productos() {
  const { productos, categorias, guardarProducto } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(0);
  const [form, setForm] = useState<Producto | null>(null);

  const lista = productos
    .filter((p) => !cat || p.categoriaId === cat)
    .filter((p) => {
      const t = q.trim().toLowerCase();
      return !t || p.nombre.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t);
    });

  const skuRepetido = form && productos.some((p) => p.sku.toLowerCase() === form.sku.trim().toLowerCase() && p.id !== form.id);
  const valido = form && form.sku.trim() && form.nombre.trim() && form.precioBase > 0 && !skuRepetido;

  return (
    <>
      <Cabecera titulo="Productos" detalle={`${productos.filter((p) => p.activo).length} productos activos. El precio base se copia al catálogo de cada campaña, donde se le puede aplicar una oferta.`}>
        <button className="btn btn-primario" onClick={() => setForm(nuevo(categorias[0].id))}>Nuevo producto</button>
      </Cabecera>

      <div className="filtros">
        <input className="input" type="search" placeholder="Busca por nombre o código" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar productos" />
        <select className="select" value={cat} onChange={(e) => setCat(Number(e.target.value))} aria-label="Categoría">
          <option value={0}>Todas las categorías</option>
          {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      <div className="hoja tabla-envoltura">
        <table className="tabla">
          <thead><tr><th>Producto</th><th>Código</th><th>Categoría</th><th className="der">Precio base</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.id}>
                <td>
                  <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Muestra producto={p} mini />
                    <span>{p.nombre}<br /><span className="tenue" style={{ fontSize: "0.8rem" }}>{p.descripcion}</span></span>
                  </span>
                </td>
                <td className="cifra">{p.sku}</td>
                <td>{categorias.find((c) => c.id === p.categoriaId)?.nombre}</td>
                <td className="der cifra">{rd(p.precioBase)}</td>
                <td>{p.activo ? <Chip tipo="ok">Activo</Chip> : <Chip tipo="neutro">Inactivo</Chip>}</td>
                <td className="der"><button className="btn btn-chico" onClick={() => setForm(p)}>Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialogo
        titulo={form?.id ? "Editar producto" : "Nuevo producto"}
        abierto={!!form}
        alCerrar={() => setForm(null)}
        pie={
          <>
            <button className="btn" onClick={() => setForm(null)}>Cancelar</button>
            <button className="btn btn-primario" disabled={!valido} onClick={() => { guardarProducto({ ...form!, sku: form!.sku.trim().toUpperCase(), nombre: form!.nombre.trim() }); setForm(null); }}>Guardar producto</button>
          </>
        }
      >
        {form && (
          <div className="rejilla-form">
            <label className="campo">
              Código (SKU)
              <input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="FR-1005" />
              {skuRepetido && <span style={{ color: "var(--rojo)", fontWeight: 400 }}>Ya existe un producto con ese código.</span>}
            </label>
            <label className="campo">
              Categoría
              <select className="select" value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: Number(e.target.value) })}>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </label>
            <label className="campo ancho">
              Nombre
              <input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </label>
            <label className="campo ancho">
              Descripción
              <textarea className="textarea" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </label>
            <label className="campo">
              Precio base (RD$)
              <input className="input cifra" type="number" min={0} step="0.01" value={form.precioBase || ""} onChange={(e) => setForm({ ...form, precioBase: Number(e.target.value) })} />
            </label>
            <label className="campo">
              Color de la muestra
              <input className="input" type="color" value={form.tono} onChange={(e) => setForm({ ...form, tono: e.target.value })} style={{ padding: 4 }} />
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }} className="ancho">
              <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
              Producto activo (aparece en el catálogo)
            </label>
          </div>
        )}
      </Dialogo>
    </>
  );
}
