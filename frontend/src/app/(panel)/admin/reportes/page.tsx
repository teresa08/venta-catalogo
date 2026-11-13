"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { ITBIS, subtotalPedido } from "@/lib/negocio";
import { num, rd } from "@/lib/format";
import { Cabecera } from "@/components/ui";
import { Barras } from "@/components/Barras";

export default function Reportes() {
  const { campanas, pedidos, productos, categorias, vendedoras } = useStore();
  const conVentas = campanas.filter((c) => c.estado !== "BORRADOR");
  const [campanaId, setCampanaId] = useState(conVentas[conVentas.length - 1]?.id ?? 1);
  const camp = campanas.find((c) => c.id === campanaId)!;
  const ps = pedidos.filter((p) => p.campanaId === campanaId && p.estado !== "CANCELADO");
  const ventas = ps.reduce((s, p) => s + subtotalPedido(p), 0);
  const unidades = ps.reduce((s, p) => s + p.lineas.reduce((a, l) => a + l.cantidad, 0), 0);

  const porCategoria = categorias
    .map((c) => ({
      etiqueta: c.nombre,
      valor: ps.reduce((s, p) => s + p.lineas.filter((l) => productos.find((x) => x.id === l.productoId)?.categoriaId === c.id).reduce((a, l) => a + l.cantidad * l.precio, 0), 0),
    }))
    .filter((d) => d.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  const porProducto = productos
    .map((p) => {
      const ls = ps.flatMap((x) => x.lineas).filter((l) => l.productoId === p.id);
      return { p, unidades: ls.reduce((s, l) => s + l.cantidad, 0), importe: ls.reduce((s, l) => s + l.cantidad * l.precio, 0) };
    })
    .filter((x) => x.unidades > 0)
    .sort((a, b) => b.importe - a.importe)
    .slice(0, 8);

  const porVendedora = vendedoras
    .map((v) => ({ etiqueta: `${v.nombre.split(" ")[0]} ${v.nombre.split(" ").at(-2) === "los" ? v.nombre.split(" ").at(-1) : v.nombre.split(" ")[1]}`, valor: ps.filter((p) => p.vendedoraId === v.id).reduce((s, p) => s + subtotalPedido(p), 0) }))
    .filter((d) => d.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  const descargarCsv = () => {
    const filas = [["Pedido", "Vendedora", "Cliente", "Estado", "Subtotal", "ITBIS", "Total"]];
    ps.forEach((p) => {
      const st = subtotalPedido(p);
      filas.push([p.numero, vendedoras.find((v) => v.id === p.vendedoraId)!.nombre, p.cliente, p.estado, st.toFixed(2), (st * ITBIS).toFixed(2), (st * (1 + ITBIS)).toFixed(2)]);
    });
    const csv = "﻿" + filas.map((f) => f.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `ventas-${camp.codigo.replace("/", "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Cabecera titulo="Reportes de ventas" detalle="Montos sin ITBIS. Los pedidos cancelados no se cuentan.">
        <select className="select" style={{ width: "auto" }} value={campanaId} onChange={(e) => setCampanaId(Number(e.target.value))} aria-label="Campaña">
          {conVentas.map((c) => <option key={c.id} value={c.id}>{c.codigo}: {c.nombre}</option>)}
        </select>
        <button className="btn" onClick={descargarCsv}>Descargar hoja de cálculo</button>
        <button className="btn" onClick={() => window.print()}>Imprimir o guardar PDF</button>
      </Cabecera>

      <dl className="resumen" style={{ marginBottom: 20 }}>
        <div><dt>Ventas</dt><dd>{rd(ventas)}</dd></div>
        <div><dt>Pedidos</dt><dd>{ps.length}</dd></div>
        <div><dt>Unidades vendidas</dt><dd>{num(unidades)}</dd></div>
        <div><dt>Pedido promedio</dt><dd>{rd(ps.length ? ventas / ps.length : 0)}</dd></div>
      </dl>

      <div className="dos-col dos-igual">
        <section className="hoja hoja-pad pila" style={{ gap: 14 }}>
          <h2>Ventas por categoría</h2>
          <Barras datos={porCategoria} formato={rd} detalle={(d) => `${d.etiqueta}: ${rd(d.valor)}, ${((d.valor / ventas) * 100).toFixed(1)} % del total`} />
        </section>
        <section className="hoja hoja-pad pila" style={{ gap: 14 }}>
          <h2>Ventas por vendedora</h2>
          <Barras datos={porVendedora} formato={rd} detalle={(d) => `${d.etiqueta}: ${rd(d.valor)}`} />
        </section>
      </div>

      <section className="hoja" style={{ marginTop: 20 }}>
        <div className="hoja-titulo"><h2>Productos más vendidos en {camp.codigo}</h2></div>
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead><tr><th>Producto</th><th>Categoría</th><th className="der">Unidades</th><th className="der">Importe</th></tr></thead>
            <tbody>
              {porProducto.map(({ p, unidades, importe }) => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td>{categorias.find((c) => c.id === p.categoriaId)?.nombre}</td>
                  <td className="der cifra">{num(unidades)}</td>
                  <td className="der cifra">{rd(importe)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
