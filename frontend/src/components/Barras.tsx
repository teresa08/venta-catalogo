"use client";

import { useState } from "react";

// Barras horizontales de una sola serie: el título del gráfico nombra la medida,
// cada barra lleva su valor como etiqueta directa y el detalle aparece al pasar el cursor.
export function Barras({
  datos,
  formato,
  detalle,
}: {
  datos: { etiqueta: string; valor: number; nota?: string }[];
  formato: (n: number) => string;
  detalle?: (d: { etiqueta: string; valor: number; nota?: string }) => string;
}) {
  const [activo, setActivo] = useState<number | null>(null);
  const max = Math.max(...datos.map((d) => d.valor), 1);
  return (
    <ul className="barras" onMouseLeave={() => setActivo(null)}>
      {datos.map((d, i) => (
        <li
          key={d.etiqueta}
          tabIndex={0}
          onMouseEnter={() => setActivo(i)}
          onFocus={() => setActivo(i)}
          onBlur={() => setActivo(null)}
          className={activo !== null && activo !== i ? "atenuada" : ""}
        >
          <span className="barras-etiqueta">{d.etiqueta}</span>
          <span className="barras-pista">
            <span className="barras-barra" style={{ width: `${(d.valor / max) * 100}%` }} />
            {activo === i && detalle && <span className="barras-tip" role="tooltip">{detalle(d)}</span>}
          </span>
          <span className="barras-valor cifra">{formato(d.valor)}</span>
        </li>
      ))}
    </ul>
  );
}
