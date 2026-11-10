"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { subtotalPedido } from "@/lib/negocio";
import { fecha, num, rd } from "@/lib/format";
import { Cabecera, Chip, EstadoPedidoChip } from "@/components/ui";
import { Barras } from "@/components/Barras";

export default function Resumen() {
  const { pedidos, campanas, campanaVigente: c, existencias, productos, vendedoras, usuario } = useStore();

  const ventasPorCampana = campanas
    .filter((x) => x.estado !== "BORRADOR")
    .map((x) => {
      const ps = pedidos.filter((p) => p.campanaId === x.id && p.estado !== "CANCELADO");
      return { etiqueta: x.codigo, valor: ps.reduce((s, p) => s + subtotalPedido(p), 0), nota: `${ps.length} pedidos` };
    });

  const deCampana = pedidos.filter((p) => p.campanaId === c?.id && p.estado !== "CANCELADO");
  const ventas = deCampana.reduce((s, p) => s + subtotalPedido(p), 0);
  const porFacturar = pedidos.filter((p) => p.estado === "ENVIADO");
  const porDespachar = pedidos.filter((p) => p.estado === "FACTURADO");
  const bajoMinimo = existencias.filter((e) => e.existencia - e.reservado <= e.minimo && productos.find((p) => p.id === e.productoId)?.activo);
  const pendientes = [...porFacturar, ...porDespachar, ...pedidos.filter((p) => p.estado === "EN_DESPACHO")];
  const accion = { ENVIADO: "Facturar", FACTURADO: "Despachar", EN_DESPACHO: "Confirmar entrega" } as Record<string, string>;

  return (
    <>
      <Cabecera
        titulo={`Hola, ${usuario?.nombre.split(" ")[0]}`}
        detalle={c ? `La campaña ${c.codigo} “${c.nombre}” recibe pedidos hasta el ${fecha(c.fechaFin)}.` : "No hay campaña publicada."}
      >
        <Link href="/admin/pedidos" className="btn btn-oscuro">Ir a pedidos</Link>
      </Cabecera>

      <dl className="resumen" style={{ marginBottom: 20 }}>
        <div><dt>Ventas de {c?.codigo}</dt><dd>{rd(ventas)}</dd></div>
        <div><dt>Pedidos por facturar</dt><dd>{porFacturar.length}<small>de {deCampana.length} en la campaña</small></dd></div>
        <div><dt>Listos para despachar</dt><dd>{porDespachar.length}</dd></div>
        <div><dt>Vendedoras activas</dt><dd>{num(vendedoras.filter((v) => v.estado === "ACTIVA").length)}</dd></div>
      </dl>

      <div className="dos-col">
        <section className="hoja">
          <div className="hoja-titulo">
            <h2>Pedidos que esperan una acción</h2>
            <span className="tenue">{pendientes.length}</span>
          </div>
          {pendientes.length === 0 ? (
            <div className="vacio"><p>No hay pedidos pendientes. Todo está entregado.</p></div>
          ) : (
            <div className="tabla-envoltura">
              <table className="tabla">
                <thead><tr><th>Pedido</th><th>Estado</th><th className="der">Subtotal</th><th></th></tr></thead>
                <tbody>
                  {pendientes.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className="nowrap" style={{ fontWeight: 600 }}>{p.numero}</span>
                        <br />
                        <span className="tenue" style={{ fontSize: "0.8rem" }}>{vendedoras.find((v) => v.id === p.vendedoraId)?.nombre}</span>
                      </td>
                      <td><EstadoPedidoChip estado={p.estado} /></td>
                      <td className="der cifra">{rd(subtotalPedido(p))}</td>
                      <td className="der"><Link className="btn btn-chico" href={`/admin/pedidos?id=${p.id}`}>{accion[p.estado]}</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="pila">
          <section className="hoja hoja-pad pila" style={{ gap: 14 }}>
            <h2>Ventas por campaña, sin ITBIS</h2>
            <Barras datos={ventasPorCampana} formato={rd} detalle={(d) => `${d.etiqueta}: ${rd(d.valor)}, ${d.nota}`} />
          </section>

          <section className="hoja">
            <div className="hoja-titulo">
              <h2>Existencias bajo el mínimo</h2>
              <Link href="/admin/inventario" className="btn btn-texto btn-chico">Ver inventario</Link>
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: "6px 0" }}>
              {bajoMinimo.map((e) => {
                const p = productos.find((x) => x.id === e.productoId)!;
                const disp = e.existencia - e.reservado;
                return (
                  <li key={e.productoId} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 20px", fontSize: "0.9rem" }}>
                    <span>{p.nombre}</span>
                    <Chip tipo={disp <= 0 ? "critico" : "alerta"}>{disp <= 0 ? "Agotado" : `${disp} disp.`}</Chip>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
