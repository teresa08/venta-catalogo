"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useStore } from "@/lib/store";
import { fecha } from "@/lib/format";
import "./acceso.css";

// Contraseña de los usuarios de demostración (database/d1/migrations/0002_datos_demo.sql).
const CLAVE_DEMO = "Demo2026!";

export default function Acceso() {
  const { listo, usuario, campanaVigente, productos, iniciarSesion } = useStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (listo && usuario) router.replace(usuario.rolId === 1 ? "/admin" : "/vendedora");
  }, [listo, usuario, router]);

  const entrar = async (correo: string, contrasena: string) => {
    setEnviando(true);
    setError(await iniciarSesion(correo, contrasena));
    setEnviando(false);
  };

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !clave) {
      setError("Escribe tu correo y tu contraseña.");
      return;
    }
    void entrar(email, clave);
  };

  const c = campanaVigente;
  const paginas = productos.filter((p) => p.activo).length * 2 + 4;

  return (
    <div className="acceso">
      <section className="portada" aria-label="Campaña vigente">
        <div className="portada-cabeza">
          <span className="marca-sello">vc</span>
          <span>Venta por Catálogo</span>
        </div>
        {c && (
          <div className="portada-campana">
            <p className="portada-ahora">Campaña vigente</p>
            <p className="portada-numero" aria-label={`Campaña ${c.numero}`}>
              <span>C</span>
              {c.numero}
            </p>
            <h1>{c.nombre}</h1>
            <p className="portada-fechas">
              {paginas} páginas. Recibimos pedidos hasta el {fecha(c.fechaFin)}.
            </p>
          </div>
        )}
        <p className="portada-pie">Registra tus pedidos, sigue su entrega y consulta tus comisiones desde el teléfono.</p>
      </section>

      <section className="formulario">
        <form onSubmit={enviar} noValidate>
          <h2>Iniciar sesión</h2>
          <p className="suave">Usa el correo que registraste con la administración.</p>
          <label className="campo">
            Correo electrónico
            <input className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="campo">
            Contraseña
            <input className="input" type="password" autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} required />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-primario" type="submit" disabled={enviando} style={{ width: "100%", minHeight: 44 }}>
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <div className="demo">
          <p>Entrar con un usuario de demostración</p>
          <button className="demo-usuario" disabled={enviando} onClick={() => entrar("ncastillo@ventacatalogo.do", CLAVE_DEMO)}>
            <strong>Nathalie Castillo</strong>
            <span>Administración: catálogo, pedidos, inventario y comisiones</span>
          </button>
          <button className="demo-usuario" disabled={enviando} onClick={() => entrar("yokasta.pena@gmail.com", CLAVE_DEMO)}>
            <strong>Yokasta Peña</strong>
            <span>Vendedora: catálogo, pedido y estado de cuenta</span>
          </button>
        </div>
      </section>
    </div>
  );
}
