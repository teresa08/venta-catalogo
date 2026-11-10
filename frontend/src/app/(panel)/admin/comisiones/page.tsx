"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { rd } from "@/lib/format";
import { Cabecera, Chip } from "@/components/ui";

export default function Comisiones() {
  const { campanas, comisiones, vendedoras, nivelesComision, calcularComisiones, aprobarComisiones } = useStore();
  const conVentas = campanas.filter((c) => c.estado !== "BORRADOR");
  const [campanaId, setCampanaId] = useState(conVentas[conVentas.length - 1]?.id ?? 1);
  const camp = campanas.find((c) => c.id === campanaId)!;
  const filas = comisiones.filter((c) => c.campanaId === campanaId).sort((a, b) => b.ventas - a.ventas);
  const pendientes = filas.some((f) => f.estado === "CALCULADA");
  const total = filas.reduce((s, f) => s + f.monto, 0);

  return (
    <>
      <Cabecera titulo="Comisiones" detalle="La comisión se calcula sobre las ventas sin ITBIS de cada vendedora en la campaña, según el nivel que alcanza.">
        <select className="select" style={{ width: "auto" }} value={campanaId} onChange={(e) => setCampanaId(Number(e.target.value))} aria-label="Campaña">
          {conVentas.map((c) => <option key={c.id} value={c.id}>{c.codigo}: {c.nombre}</option>)}
        </select>
      </Cabecera>

      <div className="dos-col">
        <section className="hoja">
          <div className="hoja-titulo">
            <h2>Liquidación de {camp.codigo}</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-chico" onClick={() => calcularComisiones(campanaId)}>{filas.length ? "Recalcular" : "Calcular comisiones"}</button>
              {pendientes && <button className="btn btn-chico btn-primario" onClick={() => aprobarComisiones(campanaId)}>Aprobar liquidación</button>}
            </div>
          </div>
          {filas.length === 0 ? (
            <div className="vacio">
              <p>Las comisiones de esta campaña aún no se han calculado.</p>
              <button className="btn btn-primario" onClick={() => calcularComisiones(campanaId)}>Calcular comisiones</button>
            </div>
          ) : (
            <div className="tabla-envoltura">
              <table className="tabla">
                <thead><tr><th>Vendedora</th><th className="der">Ventas</th><th>Nivel</th><th className="der">Comisión</th><th>Estado</th></tr></thead>
                <tbody>
                  {filas.map((f) => {
                    const v = vendedoras.find((x) => x.id === f.vendedoraId)!;
                    const n = nivelesComision.find((x) => x.porcentaje === f.porcentaje)!;
                    return (
                      <tr key={f.vendedoraId}>
                        <td>{v.nombre}<br /><span className="tenue cifra" style={{ fontSize: "0.78rem" }}>{v.codigo}</span></td>
                        <td className="der cifra">{rd(f.ventas)}</td>
                        <td>{n.nombre}, {f.porcentaje} %</td>
                        <td className="der cifra" style={{ fontWeight: 700 }}>{rd(f.monto)}</td>
                        <td>{f.estado === "PAGADA" ? <Chip tipo="ok">Pagada</Chip> : f.estado === "APROBADA" ? <Chip tipo="neutro">Aprobada</Chip> : <Chip tipo="alerta">Por aprobar</Chip>}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr><td>Total de la campaña</td><td className="der cifra">{rd(filas.reduce((s, f) => s + f.ventas, 0))}</td><td></td><td className="der cifra">{rd(total)}</td><td></td></tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        <section className="hoja hoja-pad pila" style={{ gap: 12 }}>
          <h2>Niveles de comisión</h2>
          <table className="tabla">
            <thead><tr><th>Nivel</th><th>Ventas de la campaña</th><th className="der">%</th></tr></thead>
            <tbody>
              {nivelesComision.map((n) => (
                <tr key={n.id}>
                  <td style={{ fontWeight: 600 }}>{n.nombre}</td>
                  <td className="cifra">{n.maximo ? `${rd(n.minimo)} a ${rd(n.maximo)}` : `Desde ${rd(n.minimo)}`}</td>
                  <td className="der cifra">{n.porcentaje} %</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="suave" style={{ fontSize: "0.86rem" }}>Los pedidos cancelados no suman. Si un pedido cambia después del cálculo, recalcula antes de aprobar.</p>
        </section>
      </div>
    </>
  );
}
