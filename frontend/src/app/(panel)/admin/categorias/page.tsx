"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Categoria } from "@/lib/types";
import { Cabecera, Chip, Dialogo } from "@/components/ui";

export default function Categorias() {
  const { categorias, productos, guardarCategoria } = useStore();
  const [form, setForm] = useState<Categoria | null>(null);
  const repetida = form && categorias.some((c) => c.nombre.toLowerCase() === form.nombre.trim().toLowerCase() && c.id !== form.id);

  return (
    <>
      <Cabecera titulo="Categorías" detalle="Las categorías ordenan el catálogo y los reportes de ventas.">
        <button className="btn btn-primario" onClick={() => setForm({ id: 0, nombre: "", descripcion: "", activa: true })}>Nueva categoría</button>
      </Cabecera>

      <div className="hoja tabla-envoltura">
        <table className="tabla">
          <thead><tr><th>Categoría</th><th>Descripción</th><th className="der">Productos</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {categorias.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                <td className="suave">{c.descripcion}</td>
                <td className="der cifra">{productos.filter((p) => p.categoriaId === c.id).length}</td>
                <td>{c.activa ? <Chip tipo="ok">Activa</Chip> : <Chip tipo="neutro">Inactiva</Chip>}</td>
                <td className="der"><button className="btn btn-chico" onClick={() => setForm(c)}>Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialogo
        titulo={form?.id ? "Editar categoría" : "Nueva categoría"}
        abierto={!!form}
        alCerrar={() => setForm(null)}
        pie={
          <>
            <button className="btn" onClick={() => setForm(null)}>Cancelar</button>
            <button className="btn btn-primario" disabled={!form?.nombre.trim() || !!repetida} onClick={() => { guardarCategoria({ ...form!, nombre: form!.nombre.trim() }); setForm(null); }}>Guardar categoría</button>
          </>
        }
      >
        {form && (
          <div className="pila" style={{ gap: 14 }}>
            <label className="campo">
              Nombre
              <input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              {repetida && <span style={{ color: "var(--rojo)", fontWeight: 400 }}>Ya existe una categoría con ese nombre.</span>}
            </label>
            <label className="campo">
              Descripción
              <input className="input" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })} />
              Categoría activa
            </label>
          </div>
        )}
      </Dialogo>
    </>
  );
}
