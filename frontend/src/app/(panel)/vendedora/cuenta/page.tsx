"use client";

import { useStore } from "@/lib/store";
import { ITBIS, nivelPara, subtotalPedido } from "@/lib/negocio";
import { fecha, rd } from "@/lib/format";
import { Cabecera, Chip } from "@/components/ui";

interface Movimiento {
  fecha: string;
  concepto: string;
  cargo: number;
  abono: number;
}

export default function EstadoCuenta() {
  const { pedidos, comisiones, pagos, campanas, nivelesComision, vendedoraSesion: v, campanaVigente } = useStore();
  if (!v) return null;

  const facturados = pedidos.filter((p) => p.vendedoraId === v.id && p.factura && p.estado !== "CANCELADO");
  const movimientos: Movimiento[] = [
    ...facturados.map((p) => ({ fecha: p.factura!.fecha, concepto: `Factura ${p.factura!.numero}`, cargo: subtotalPedido(p) * (1 + ITBIS), abono: 0 })),
    ...comisiones
      .filter((c) => c.vendedoraId === v.id && c.estado !== "CALCULADA")
      .map((c) => {
        const camp = campanas.find((x) => x.id === c.campanaId)!;
        return { fecha: `${camp.fechaFin}T18:00:00`, concepto: `Comisión ${camp.codigo} (${c.porcentaje} %)`, cargo: 0, abono: c.monto };
      }),
    ...pagos.filter((p) => p.vendedoraId === v.id).map((p) => ({ fecha: `${p.fecha}T12:00:00`, concepto: `Pago: ${p.referencia}`, cargo: 0, abono: p.monto })),
  ].sort((a, b) => a.fecha.localeCompare(b.fecha));

  let saldo = 0;
  const conSaldo = movimientos.map((m) => ({ ...m, saldo: (saldo += m.cargo - m.abono) }));

  // Avance hacia el siguiente nivel en la campaña vigente
  const ventasActuales = campanaVigente
    ? pedidos.filter((p) => p.vendedoraId === v.id && p.campanaId === campanaVigente.id && p.estado !== "CANCELADO").reduce((s, p) => s + subtotalPedido(p), 0)
    : 0;
  const nivel = nivelPara(nivelesComision, ventasActuales);
  const siguiente = nivelesComision.find((n) => n.minimo > ventasActuales);

  return (
    <>
      <Cabecera titulo="Estado de cuenta" detalle={`${v.nombre}, código ${v.codigo}. Zona ${v.zona}.`} />

      <dl className="resumen" style={{ marginBottom: 20 }}>
        <div>
          <dt>Saldo pendiente</dt>
          <dd className="cifra" style={{ color: saldo > 0 ? "var(--fucsia)" : "var(--jade)" }}>{rd(Math.max(saldo, 0))}</dd>
        </div>
        <div>
          <dt>Ventas en {campanaVigente?.codigo}</dt>
          <dd>{rd(ventasActuales)}</dd>
        </div>
        <div>
          <dt>Nivel de comisión</dt>
          <dd>{nivel.nombre}<small>{nivel.porcentaje} %</small></dd>
        </div>
        <div>
          <dt>Comisión estimada</dt>
          <dd>{rd((ventasActuales * nivel.porcentaje) / 100)}</dd>
        </div>
      </dl>

      {siguiente && (
        <div className="hoja hoja-pad" style={{ marginBottom: 20 }}>
          <p style={{ marginBottom: 10 }}>
            Te faltan <strong className="cifra">{rd(siguiente.minimo - ventasActuales)}</strong> en ventas para llegar al nivel {siguiente.nombre} y ganar el {siguiente.porcentaje} % en esta campaña.
          </p>
          <div style={{ height: 10, borderRadius: 999, background: "var(--linea)", overflow: "hidden" }} role="progressbar" aria-valuemin={0} aria-valuemax={siguiente.minimo} aria-valuenow={ventasActuales} aria-label={`Avance hacia el nivel ${siguiente.nombre}`}>
            <div style={{ width: `${Math.min(100, (ventasActuales / siguiente.minimo) * 100)}%`, height: "100%", background: "var(--fucsia)", borderRadius: 999 }} />
          </div>
        </div>
      )}

      <section className="hoja">
        <div className="hoja-titulo">
          <h2>Movimientos</h2>
          <Chip tipo={saldo > 0 ? "alerta" : "ok"}>{saldo > 0 ? "Con saldo pendiente" : "Al día"}</Chip>
        </div>
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr><th>Fecha</th><th>Concepto</th><th className="der">Cargo</th><th className="der">Abono</th><th className="der">Saldo</th></tr>
            </thead>
            <tbody>
              {conSaldo.map((m, i) => (
                <tr key={i}>
                  <td className="cifra">{fecha(m.fecha)}</td>
                  <td>{m.concepto}</td>
                  <td className="der cifra">{m.cargo ? rd(m.cargo) : ""}</td>
                  <td className="der cifra" style={{ color: "var(--jade)" }}>{m.abono ? rd(m.abono) : ""}</td>
                  <td className="der cifra">{rd(m.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
