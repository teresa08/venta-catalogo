"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { permisosDescritos } from "@/lib/negocio";
import { fechaHora } from "@/lib/format";
import type { Usuario } from "@/lib/types";
import { Cabecera, Chip, Dialogo } from "@/components/ui";
import { Icono } from "@/components/Icono";

export default function Usuarios() {
  const { usuarios, roles, usuario: yo, guardarUsuario } = useStore();
  const [form, setForm] = useState<(Usuario & { clave?: string }) | null>(null);
  const claveValida = !form || form.id !== 0 || (form.clave ?? "").length >= 8;
  const emailValido = form && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const repetido = form && usuarios.some((u) => u.email.toLowerCase() === form.email.trim().toLowerCase() && u.id !== form.id);

  return (
    <>
      <Cabecera titulo="Usuarios y roles" detalle="Cada usuario entra con un rol, y el rol define qué puede hacer en el sistema.">
        <button className="btn btn-primario" onClick={() => setForm({ id: 0, nombre: "", email: "", rolId: 2, activo: true, ultimoAcceso: null, clave: "" })}>Nuevo usuario</button>
      </Cabecera>

      <div className="dos-col">
        <div className="hoja tabla-envoltura">
          <table className="tabla">
            <thead><tr><th>Usuario</th><th>Rol</th><th>Último acceso</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.nombre}<br /><span className="tenue" style={{ fontSize: "0.8rem" }}>{u.email}</span></td>
                  <td>{roles.find((r) => r.id === u.rolId)?.nombre}</td>
                  <td className="cifra">{u.ultimoAcceso ? fechaHora(u.ultimoAcceso) : <span className="tenue">Nunca</span>}</td>
                  <td>{u.activo ? <Chip tipo="ok">Activo</Chip> : <Chip tipo="neutro">Desactivado</Chip>}</td>
                  <td className="der"><button className="btn btn-chico" onClick={() => setForm(u)}>Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="pila" style={{ gap: 14 }}>
          {roles.map((r) => (
            <div key={r.id} className="hoja hoja-pad">
              <h3 style={{ marginBottom: 8 }}>{r.nombre}</h3>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4, fontSize: "0.87rem" }}>
                {r.permisos.map((p) => (
                  <li key={p} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ width: 14, height: 14, color: "var(--jade)", display: "grid" }}><Icono nombre="check" /></span>
                    {permisosDescritos[p]}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </div>

      <Dialogo
        titulo={form?.id ? "Editar usuario" : "Nuevo usuario"}
        subtitulo={!form?.id && "Comparte la contraseña inicial con la persona para que pueda entrar."}
        abierto={!!form}
        alCerrar={() => setForm(null)}
        pie={
          <>
            <button className="btn" onClick={() => setForm(null)}>Cancelar</button>
            <button className="btn btn-primario" disabled={!form?.nombre.trim() || !emailValido || !!repetido || !claveValida} onClick={async () => { if (await guardarUsuario({ ...form!, email: form!.email.trim().toLowerCase() })) setForm(null); }}>Guardar usuario</button>
          </>
        }
      >
        {form && (
          <div className="rejilla-form">
            <label className="campo ancho">
              Nombre completo
              <input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </label>
            <label className="campo ancho">
              Correo electrónico
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {repetido && <span style={{ color: "var(--rojo)", fontWeight: 400 }}>Ese correo ya pertenece a otro usuario.</span>}
            </label>
            {form.id === 0 && (
              <label className="campo ancho">
                Contraseña inicial
                <input className="input" type="password" autoComplete="new-password" value={form.clave ?? ""} onChange={(e) => setForm({ ...form, clave: e.target.value })} />
                {!claveValida && <span className="tenue" style={{ fontWeight: 400 }}>Mínimo 8 caracteres.</span>}
              </label>
            )}
            <label className="campo">
              Rol
              <select className="select" value={form.rolId} disabled={form.id === yo?.id} onChange={(e) => setForm({ ...form, rolId: Number(e.target.value) })}>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center", alignSelf: "end", minHeight: 40 }}>
              <input type="checkbox" checked={form.activo} disabled={form.id === yo?.id} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
              Puede iniciar sesión
            </label>
            {form.id === yo?.id && <p className="tenue ancho" style={{ fontSize: "0.85rem" }}>No puedes cambiar tu propio rol ni desactivarte.</p>}
          </div>
        )}
      </Dialogo>
    </>
  );
}
