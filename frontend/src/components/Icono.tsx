const trazos: Record<string, string> = {
  resumen: "M4 13h6V4H4v9Zm10 7h6V11h-6v9ZM4 20h6v-4H4v4Zm10-13h6V4h-6v3Z",
  campana: "M4 5h7a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4V5Zm16 0h-5a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h5V5Z",
  producto: "M12 3 4 7v10l8 4 8-4V7l-8-4Zm0 0v18M4 7l8 4 8-4",
  categoria: "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 3.5a3.5 3.5 0 1 0 7 0 3.5 3.5 0 0 0-7 0Z",
  inventario: "M3 7h18M5 7v13h14V7M9 11h6M8 3h8l1 4H7l1-4Z",
  pedido: "M6 3h9l4 4v14H6V3Zm9 0v4h4M9 12h7M9 16h5",
  vendedora: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",
  comision: "M5 19 19 5M7.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm9 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  usuario: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0m1-9 2 2 4-4",
  reporte: "M4 20V10m6 10V4m6 16v-7m4 7H2",
  catalogo: "M3 5c3-1.5 6-1.5 9 0v15c-3-1.5-6-1.5-9 0V5Zm9 0c3-1.5 6-1.5 9 0v15c-3-1.5-6-1.5-9 0",
  carrito: "M3 4h2l2.4 11h10.2L20 7H6.2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  cuenta: "M3 6h18v12H3V6Zm0 4h18M7 15h4",
  salir: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  check: "m5 12 5 5 9-10",
  mas: "M12 5v14M5 12h14",
  menos: "M5 12h14",
  buscar: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4 4",
  descargar: "M12 4v11m-5-5 5 5 5-5M5 20h14",
};

export function Icono({ nombre, titulo }: { nombre: keyof typeof trazos | string; titulo?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden={titulo ? undefined : true} role={titulo ? "img" : undefined}>
      {titulo && <title>{titulo}</title>}
      <path d={trazos[nombre]} />
    </svg>
  );
}
