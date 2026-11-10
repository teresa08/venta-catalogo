"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { fecha, rd } from "@/lib/format";
import { Muestra } from "@/components/ui";
import { Icono } from "@/components/Icono";
import "./catalogo.css";

export default function Catalogo() {
  const { campanaVigente: c, productos, categorias, catalogo, existencias, carrito, agregarAlCarrito, cambiarCantidad, usuario } = useStore();
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState<number | null>(null);
  const puedePedir = usuario?.rolId === 2;

  const items = useMemo(() => {
    if (!c) return [];
    const q = busqueda.trim().toLowerCase();
    return catalogo
      .filter((i) => i.campanaId === c.id)
      .map((i) => ({ ...i, producto: productos.find((p) => p.id === i.productoId)! }))
      .filter((i) => i.producto?.activo)
      .filter((i) => categoria === null || i.producto.categoriaId === categoria)
      .filter((i) => !q || i.producto.nombre.toLowerCase().includes(q) || i.producto.sku.toLowerCase().includes(q))
      .sort((a, b) => a.pagina - b.pagina);
  }, [c, productos, catalogo, busqueda, categoria]);

  if (!c) {
    return (
      <div className="vacio hoja">
        <h2>No hay una campaña publicada</h2>
        <p>La administración publicará el próximo catálogo en los próximos días.</p>
      </div>
    );
  }

  const enCarrito = carrito.reduce((s, l) => s + l.cantidad, 0);

  return (
    <>
      <header className="cat-cabecera">
        <div className="cat-folio" aria-hidden>
          <span>C</span>
          {c.numero}
        </div>
        <div>
          <h1>{c.nombre}</h1>
          <p className="suave">
            Campaña {c.codigo}, del {fecha(c.fechaInicio)} al {fecha(c.fechaFin)}. Los precios ya incluyen las ofertas de la campaña; el ITBIS se suma al facturar.
          </p>
        </div>
        {puedePedir && enCarrito > 0 && (
          <Link href="/vendedora/carrito" className="btn btn-oscuro cat-ir">
            Ver mi pedido ({enCarrito})
          </Link>
        )}
      </header>

      <div className="filtros">
        <label className="sr" htmlFor="buscar">Buscar en el catálogo</label>
        <input
          id="buscar"
          className="input"
          type="search"
          placeholder="Busca por nombre o código"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div className="chips" role="group" aria-label="Categorías">
          <button className="chip" aria-pressed={categoria === null} onClick={() => setCategoria(null)}>Todo</button>
          {categorias.filter((k) => k.activa).map((k) => (
            <button key={k.id} className="chip" aria-pressed={categoria === k.id} onClick={() => setCategoria(k.id)}>
              {k.nombre}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="vacio hoja">
          <p>Ningún producto coincide con “{busqueda}”. Prueba con otra palabra o quita el filtro de categoría.</p>
          <button className="btn" onClick={() => { setBusqueda(""); setCategoria(null); }}>Ver todo el catálogo</button>
        </div>
      ) : (
        <ul className="paginas">
          {items.map((i) => {
            const ex = existencias.find((e) => e.productoId === i.productoId);
            const disponible = ex ? ex.existencia - ex.reservado : 0;
            const linea = carrito.find((l) => l.productoId === i.productoId);
            const agotado = disponible <= 0;
            return (
              <li key={i.productoId} className={`pagina ${i.destacado ? "pagina-destacada" : ""}`}>
                <span className="pagina-num cifra">pág. {i.pagina}</span>
                <Muestra producto={i.producto} />
                <div className="pagina-texto">
                  <p className="tenue cifra" style={{ fontSize: "0.78rem" }}>{i.producto.sku}</p>
                  <h3>{i.producto.nombre}</h3>
                  <p className="suave" style={{ fontSize: "0.86rem" }}>{i.producto.descripcion}</p>
                </div>
                <div className="pagina-pie">
                  <div className="precio cifra">
                    {i.precioOferta ? (
                      <>
                        <strong>{rd(i.precioOferta)}</strong>
                        <s>{rd(i.precio)}</s>
                      </>
                    ) : (
                      <strong>{rd(i.precio)}</strong>
                    )}
                    <span className={agotado ? "stock stock-no" : disponible < 10 ? "stock stock-poco" : "stock"}>
                      {agotado ? "Agotado" : disponible < 10 ? `Quedan ${disponible}` : "Disponible"}
                    </span>
                  </div>
                  {puedePedir &&
                    (linea ? (
                      <div className="paso" role="group" aria-label={`Cantidad de ${i.producto.nombre}`}>
                        <button onClick={() => cambiarCantidad(i.productoId, linea.cantidad - 1)} aria-label="Quitar uno"><Icono nombre="menos" /></button>
                        <span className="cifra" aria-live="polite">{linea.cantidad}</span>
                        <button onClick={() => agregarAlCarrito(i.productoId)} disabled={linea.cantidad >= disponible} aria-label="Agregar uno"><Icono nombre="mas" /></button>
                      </div>
                    ) : (
                      <button className="btn btn-primario btn-chico" disabled={agotado} onClick={() => agregarAlCarrito(i.productoId)}>
                        Agregar
                      </button>
                    ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
