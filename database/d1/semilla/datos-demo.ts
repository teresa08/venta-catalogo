// Data mockeada del Sistema de Venta por Catálogo.
// Fuente de los datos de demostración. generar-datos.ts la convierte en SQL para D1.
import type {
  Campana,
  Categoria,
  CambioEstado,
  Comision,
  EstadoPedido,
  Existencia,
  ItemCatalogo,
  MovimientoInventario,
  NivelComision,
  PagoVendedora,
  Pedido,
  Producto,
  Rol,
  Usuario,
  Vendedora,
} from "../../../frontend/src/server/domain/tipos.ts";

export const ITBIS = 0.18;
export const HOY = "2026-10-21";

export const roles: Rol[] = [
  {
    id: 1,
    codigo: "ADMIN",
    nombre: "Administrador",
    permisos: [
      "usuarios.gestionar",
      "catalogo.gestionar",
      "campanas.publicar",
      "pedidos.facturar",
      "pedidos.despachar",
      "inventario.gestionar",
      "vendedoras.gestionar",
      "comisiones.calcular",
      "reportes.ver",
    ],
  },
  {
    id: 2,
    codigo: "VENDEDORA",
    nombre: "Vendedora independiente",
    permisos: ["catalogo.consultar", "pedidos.registrar", "pedidos.consultar", "cuenta.consultar"],
  },
  {
    id: 3,
    codigo: "CLIENTE",
    nombre: "Cliente final",
    permisos: ["catalogo.consultar"],
  },
];

export const permisosDescritos: Record<string, string> = {
  "usuarios.gestionar": "Crear usuarios y asignar roles",
  "catalogo.gestionar": "Administrar categorías y productos",
  "campanas.publicar": "Crear y publicar campañas",
  "pedidos.facturar": "Facturar pedidos",
  "pedidos.despachar": "Despachar y confirmar entregas",
  "inventario.gestionar": "Registrar entradas y ajustes de inventario",
  "vendedoras.gestionar": "Registrar y administrar vendedoras",
  "comisiones.calcular": "Calcular y aprobar comisiones",
  "reportes.ver": "Ver y descargar reportes de ventas",
  "catalogo.consultar": "Consultar el catálogo vigente",
  "pedidos.registrar": "Registrar y enviar pedidos",
  "pedidos.consultar": "Consultar el estado de sus pedidos",
  "cuenta.consultar": "Consultar su estado de cuenta",
};

export const usuarios: Usuario[] = [
  { id: 1, nombre: "Nathalie Castillo Abreu", email: "ncastillo@ventacatalogo.do", rolId: 1, activo: true, ultimoAcceso: "2026-10-21T08:12:00" },
  { id: 2, nombre: "Yokasta Peña Almonte", email: "yokasta.pena@gmail.com", rolId: 2, activo: true, ultimoAcceso: "2026-10-20T21:40:00" },
  { id: 3, nombre: "Rosanna Batista Féliz", email: "rosannabf@hotmail.com", rolId: 2, activo: true, ultimoAcceso: "2026-10-19T10:05:00" },
  { id: 4, nombre: "Carolina Mejía Ureña", email: "caromejia@gmail.com", rolId: 2, activo: true, ultimoAcceso: "2026-10-18T16:22:00" },
  { id: 5, nombre: "Ramón Encarnación", email: "rencarnacion@ventacatalogo.do", rolId: 1, activo: true, ultimoAcceso: "2026-10-17T09:30:00" },
  { id: 6, nombre: "Pedro Almánzar Rosario", email: "palmanzar@gmail.com", rolId: 3, activo: true, ultimoAcceso: "2026-10-02T19:10:00" },
  { id: 7, nombre: "Ana Julia Paulino", email: "anajpaulino@gmail.com", rolId: 2, activo: false, ultimoAcceso: "2026-08-29T11:00:00" },
];

export const categorias: Categoria[] = [
  { id: 1, nombre: "Fragancias", descripcion: "Perfumes, colonias y body mists", activa: true },
  { id: 2, nombre: "Maquillaje", descripcion: "Labiales, bases, máscaras y sombras", activa: true },
  { id: 3, nombre: "Cuidado facial", descripcion: "Hidratantes, protectores y limpiadores", activa: true },
  { id: 4, nombre: "Cuidado corporal", descripcion: "Cremas, exfoliantes y desodorantes", activa: true },
  { id: 5, nombre: "Cabello", descripcion: "Champús, mascarillas y aceites", activa: true },
  { id: 6, nombre: "Hogar", descripcion: "Cocina, organización y aromas", activa: true },
  { id: 7, nombre: "Accesorios", descripcion: "Carteras y bisutería artesanal", activa: true },
];

export const productos: Producto[] = [
  { id: 1, sku: "FR-1001", nombre: "Eau de parfum Brisa de Samaná 50 ml", descripcion: "Notas de coco, sal marina y jazmín.", categoriaId: 1, precioBase: 2450, activo: true, tono: "#7FB7BE" },
  { id: 2, sku: "FR-1002", nombre: "Colonia Flor de Bayahíbe 100 ml", descripcion: "Floral fresca, para uso diario.", categoriaId: 1, precioBase: 1290, activo: true, tono: "#E9A6B9" },
  { id: 3, sku: "FR-1003", nombre: "Perfume Cordillera para hombre 75 ml", descripcion: "Amaderado con notas de café y cedro.", categoriaId: 1, precioBase: 2890, activo: true, tono: "#5B4A3F" },
  { id: 4, sku: "FR-1004", nombre: "Body mist Coco y vainilla 200 ml", descripcion: "Bruma corporal de larga duración.", categoriaId: 1, precioBase: 690, activo: true, tono: "#EAD7B7" },
  { id: 5, sku: "MQ-2001", nombre: "Labial mate Cayena", descripcion: "Rojo intenso, acabado mate de 8 horas.", categoriaId: 2, precioBase: 495, activo: true, tono: "#B3123A" },
  { id: 6, sku: "MQ-2002", nombre: "Base líquida cobertura media", descripcion: "Disponible en 12 tonos.", categoriaId: 2, precioBase: 875, activo: true, tono: "#C99772" },
  { id: 7, sku: "MQ-2003", nombre: "Máscara de pestañas volumen", descripcion: "Fórmula a prueba de agua.", categoriaId: 2, precioBase: 560, activo: true, tono: "#2B2530" },
  { id: 8, sku: "MQ-2004", nombre: "Paleta de sombras Atardecer", descripcion: "Doce tonos cálidos mates y satinados.", categoriaId: 2, precioBase: 1150, activo: true, tono: "#D9773E" },
  { id: 9, sku: "CF-3001", nombre: "Crema hidratante con aloe 50 g", descripcion: "Para piel mixta a grasa.", categoriaId: 3, precioBase: 780, activo: true, tono: "#9CC9A0" },
  { id: 10, sku: "CF-3002", nombre: "Protector solar facial FPS 50", descripcion: "Toque seco, sin color.", categoriaId: 3, precioBase: 940, activo: true, tono: "#F2C94C" },
  { id: 11, sku: "CF-3003", nombre: "Sérum vitamina C 30 ml", descripcion: "Unifica el tono de la piel.", categoriaId: 3, precioBase: 1380, activo: true, tono: "#F29E4C" },
  { id: 12, sku: "CF-3004", nombre: "Agua micelar 250 ml", descripcion: "Desmaquilla y limpia en un paso.", categoriaId: 3, precioBase: 520, activo: true, tono: "#B9D6EE" },
  { id: 13, sku: "CC-4001", nombre: "Crema corporal manteca de cacao 400 ml", descripcion: "Hidratación profunda 24 horas.", categoriaId: 4, precioBase: 610, activo: true, tono: "#8C5A3C" },
  { id: 14, sku: "CC-4002", nombre: "Exfoliante de café dominicano", descripcion: "Con café de Jarabacoa y azúcar.", categoriaId: 4, precioBase: 545, activo: true, tono: "#6B4226" },
  { id: 15, sku: "CC-4003", nombre: "Desodorante roll-on sin alcohol", descripcion: "Protección de 48 horas.", categoriaId: 4, precioBase: 235, activo: true, tono: "#C8D3DD" },
  { id: 16, sku: "CC-4004", nombre: "Jabón artesanal de avena (3 u.)", descripcion: "Para piel sensible.", categoriaId: 4, precioBase: 390, activo: true, tono: "#E3D3B0" },
  { id: 17, sku: "CA-5001", nombre: "Champú reparador de sábila 400 ml", descripcion: "Para cabello maltratado.", categoriaId: 5, precioBase: 455, activo: true, tono: "#7BB274" },
  { id: 18, sku: "CA-5002", nombre: "Mascarilla capilar de aguacate", descripcion: "Nutrición intensiva semanal.", categoriaId: 5, precioBase: 620, activo: true, tono: "#5F7F3A" },
  { id: 19, sku: "CA-5003", nombre: "Aceite de coco para puntas 60 ml", descripcion: "Sella las puntas abiertas.", categoriaId: 5, precioBase: 410, activo: true, tono: "#F1E9D2" },
  { id: 20, sku: "HO-6001", nombre: "Juego de envases herméticos (5 u.)", descripcion: "Aptos para microondas.", categoriaId: 6, precioBase: 1650, activo: true, tono: "#7D9BB5" },
  { id: 21, sku: "HO-6002", nombre: "Vela aromática de canela", descripcion: "40 horas de duración.", categoriaId: 6, precioBase: 480, activo: true, tono: "#A0522D" },
  { id: 22, sku: "HO-6003", nombre: "Set de paños de cocina bordados", descripcion: "Cuatro piezas de algodón.", categoriaId: 6, precioBase: 720, activo: true, tono: "#D8C3E0" },
  { id: 23, sku: "AC-7001", nombre: "Cartera tejida de guano", descripcion: "Hecha a mano en Higüey.", categoriaId: 7, precioBase: 1890, activo: true, tono: "#C9A66B" },
  { id: 24, sku: "AC-7002", nombre: "Aretes de larimar en plata", descripcion: "Plata 925 con piedra larimar.", categoriaId: 7, precioBase: 2350, activo: false, tono: "#6EC3D9" },
];

export const campanas: Campana[] = [
  { id: 1, codigo: "C-09/2026", nombre: "Regreso a clases", numero: 9, anio: 2026, fechaInicio: "2026-08-31", fechaFin: "2026-09-20", estado: "CERRADA" },
  { id: 2, codigo: "C-10/2026", nombre: "Mes de la Virgen de las Mercedes", numero: 10, anio: 2026, fechaInicio: "2026-09-21", fechaFin: "2026-10-11", estado: "CERRADA" },
  { id: 3, codigo: "C-11/2026", nombre: "Brisas de octubre", numero: 11, anio: 2026, fechaInicio: "2026-10-12", fechaFin: "2026-11-01", estado: "PUBLICADA" },
  { id: 4, codigo: "C-12/2026", nombre: "Regalos de Navidad", numero: 12, anio: 2026, fechaInicio: "2026-11-02", fechaFin: "2026-11-22", estado: "BORRADOR" },
];

// Página del catálogo impreso y ofertas por campaña.
const ofertasPorCampana: Record<number, Record<number, number>> = {
  1: { 9: 690, 17: 395, 20: 1450 },
  2: { 2: 1090, 13: 520, 21: 399 },
  3: { 1: 2190, 5: 425, 11: 1190, 18: 540, 23: 1690 },
  4: { 3: 2590, 22: 620 },
};
const destacadosPorCampana: Record<number, number[]> = {
  1: [9, 17],
  2: [2, 13],
  3: [1, 11, 23],
  4: [3, 20],
};

export const catalogo: ItemCatalogo[] = campanas.flatMap((c) =>
  productos
    .filter((p) => p.id !== 24 || c.id === 1)
    .map((p, i) => ({
      campanaId: c.id,
      productoId: p.id,
      pagina: 4 + i * 2 - (i % 2),
      precio: p.precioBase,
      precioOferta: ofertasPorCampana[c.id]?.[p.id] ?? null,
      destacado: destacadosPorCampana[c.id]?.includes(p.id) ?? false,
    })),
);

export const existencias: Existencia[] = [
  [1, 46, 6, 15], [2, 88, 4, 20], [3, 12, 3, 15], [4, 130, 10, 25],
  [5, 210, 18, 40], [6, 64, 5, 20], [7, 9, 4, 20], [8, 37, 2, 10],
  [9, 75, 3, 20], [10, 58, 6, 15], [11, 22, 8, 10], [12, 96, 2, 20],
  [13, 140, 5, 30], [14, 0, 0, 15], [15, 260, 12, 50], [16, 81, 0, 20],
  [17, 115, 6, 25], [18, 44, 9, 15], [19, 70, 1, 15], [20, 18, 2, 8],
  [21, 53, 0, 12], [22, 31, 1, 10], [23, 7, 3, 6], [24, 15, 0, 5],
].map(([productoId, existencia, reservado, minimo]) => ({ productoId, existencia, reservado, minimo }));

export const movimientos: MovimientoInventario[] = [
  { id: 1, productoId: 5, tipo: "ENTRADA", cantidad: 150, referencia: "Recepción OC-2026-118", fecha: "2026-10-08T10:20:00" },
  { id: 2, productoId: 11, tipo: "ENTRADA", cantidad: 40, referencia: "Recepción OC-2026-118", fecha: "2026-10-08T10:24:00" },
  { id: 3, productoId: 14, tipo: "SALIDA", cantidad: 12, referencia: "Despacho PED-2026-000141", fecha: "2026-10-14T15:02:00" },
  { id: 4, productoId: 7, tipo: "AJUSTE", cantidad: -3, referencia: "Conteo físico: unidades dañadas", fecha: "2026-10-16T17:45:00" },
  { id: 5, productoId: 1, tipo: "RESERVA", cantidad: 2, referencia: "Pedido PED-2026-000153", fecha: "2026-10-19T09:15:00" },
  { id: 6, productoId: 23, tipo: "SALIDA", cantidad: 2, referencia: "Despacho PED-2026-000149", fecha: "2026-10-20T14:30:00" },
];

export const nivelesComision: NivelComision[] = [
  { id: 1, nombre: "Bronce", minimo: 0, maximo: 14999.99, porcentaje: 20 },
  { id: 2, nombre: "Plata", minimo: 15000, maximo: 39999.99, porcentaje: 25 },
  { id: 3, nombre: "Oro", minimo: 40000, maximo: null, porcentaje: 30 },
];

export const vendedoras: Vendedora[] = [
  { id: 1, usuarioId: 2, codigo: "V-0001", nombre: "Yokasta Peña Almonte", cedula: "001-1234567-8", telefono: "809-555-0141", zona: "Santo Domingo Este", fechaIngreso: "2024-03-11", estado: "ACTIVA" },
  { id: 2, usuarioId: 3, codigo: "V-0002", nombre: "Rosanna Batista Féliz", cedula: "031-0456789-2", telefono: "829-555-0172", zona: "Santiago", fechaIngreso: "2023-07-02", estado: "ACTIVA" },
  { id: 3, usuarioId: 4, codigo: "V-0003", nombre: "Carolina Mejía Ureña", cedula: "026-0987654-1", telefono: "849-555-0110", zona: "La Romana", fechaIngreso: "2025-01-20", estado: "ACTIVA" },
  { id: 4, usuarioId: null, codigo: "V-0004", nombre: "Wendy Jiménez Polanco", cedula: "002-0345612-9", telefono: "809-555-0193", zona: "San Cristóbal", fechaIngreso: "2025-06-09", estado: "ACTIVA" },
  { id: 5, usuarioId: null, codigo: "V-0005", nombre: "Altagracia de los Santos", cedula: "001-0765432-3", telefono: "829-555-0128", zona: "Distrito Nacional", fechaIngreso: "2022-11-14", estado: "ACTIVA" },
  { id: 6, usuarioId: null, codigo: "V-0006", nombre: "Massiel Reyes Tejada", cedula: "037-0234567-5", telefono: "809-555-0166", zona: "Puerto Plata", fechaIngreso: "2026-02-03", estado: "ACTIVA" },
  { id: 7, usuarioId: 7, codigo: "V-0007", nombre: "Ana Julia Paulino", cedula: "223-0112233-4", telefono: "849-555-0150", zona: "Santo Domingo Este", fechaIngreso: "2024-09-23", estado: "SUSPENDIDA" },
  { id: 8, usuarioId: null, codigo: "V-0008", nombre: "Leidy Marte Guzmán", cedula: "031-0678901-7", telefono: "829-555-0187", zona: "Santiago", fechaIngreso: "2026-05-18", estado: "ACTIVA" },
];

// [id, número, campaña, vendedora, cliente, estado, fecha de envío, líneas [producto, cantidad]]
type FilaPedido = [number, number, number, number, string, EstadoPedido, string, [number, number][]];

const filasPedidos: FilaPedido[] = [
  [1, 101, 1, 1, "Mildred Santana", "ENTREGADO", "2026-09-02", [[1, 2], [5, 6], [9, 4], [17, 5]]],
  [2, 104, 1, 2, "Clientes varios Gurabo", "ENTREGADO", "2026-09-04", [[3, 3], [6, 5], [13, 8], [20, 4], [23, 2]]],
  [3, 107, 1, 3, "Esther Guerrero", "ENTREGADO", "2026-09-07", [[2, 3], [10, 2], [15, 10]]],
  [4, 110, 1, 5, "Salón Belleza Total", "ENTREGADO", "2026-09-09", [[6, 10], [7, 8], [8, 6], [12, 10], [18, 6], [1, 4]]],
  [5, 113, 1, 4, "Rafaela Ozuna", "ENTREGADO", "2026-09-12", [[14, 4], [16, 5], [21, 3]]],
  [6, 115, 1, 1, "Oficina Banreservas Megacentro", "ENTREGADO", "2026-09-16", [[4, 10], [11, 4], [22, 3], [19, 6]]],
  [7, 118, 1, 6, "Juana Hilario", "CANCELADO", "2026-09-18", [[24, 1], [2, 1]]],
  [8, 121, 2, 1, "Grupo de la iglesia San Vicente", "ENTREGADO", "2026-09-23", [[2, 8], [13, 10], [21, 6], [5, 10], [1, 3]]],
  [9, 124, 2, 2, "Clientes varios Gurabo", "ENTREGADO", "2026-09-25", [[3, 4], [8, 4], [20, 5], [23, 3], [11, 3]]],
  [10, 127, 2, 5, "Salón Belleza Total", "ENTREGADO", "2026-09-28", [[6, 12], [7, 10], [12, 8], [17, 12], [18, 8]]],
  [11, 130, 2, 3, "Esther Guerrero", "ENTREGADO", "2026-10-01", [[9, 3], [10, 4], [16, 6], [4, 4]]],
  [12, 133, 2, 8, "Yesenia Taveras", "ENTREGADO", "2026-10-03", [[5, 4], [15, 6], [19, 3]]],
  [13, 136, 2, 4, "Rafaela Ozuna", "ENTREGADO", "2026-10-06", [[14, 6], [22, 4], [13, 4], [2, 2]]],
  [14, 139, 2, 6, "Juana Hilario", "ENTREGADO", "2026-10-09", [[1, 2], [11, 2], [9, 2]]],
  [15, 141, 3, 1, "Mildred Santana", "ENTREGADO", "2026-10-13", [[14, 12], [5, 6], [11, 2]]],
  [16, 144, 3, 2, "Clientes varios Gurabo", "EN_DESPACHO", "2026-10-15", [[3, 2], [23, 2], [6, 6], [10, 5], [20, 3]]],
  [17, 146, 3, 5, "Salón Belleza Total", "FACTURADO", "2026-10-16", [[7, 8], [8, 5], [12, 6], [18, 9]]],
  [18, 149, 3, 3, "Esther Guerrero", "EN_DESPACHO", "2026-10-17", [[23, 2], [1, 1], [4, 6]]],
  [19, 151, 3, 1, "Oficina Banreservas Megacentro", "FACTURADO", "2026-10-18", [[2, 4], [9, 3], [15, 12], [21, 4]]],
  [20, 153, 3, 4, "Rafaela Ozuna", "ENVIADO", "2026-10-19", [[1, 2], [13, 5], [16, 3]]],
  [21, 155, 3, 8, "Yesenia Taveras", "ENVIADO", "2026-10-20", [[5, 8], [17, 6], [19, 1]]],
  [22, 157, 3, 1, "Wilkin Paredes", "ENVIADO", "2026-10-21", [[3, 1], [11, 6], [18, 9]]],
];

const orden: EstadoPedido[] = ["ENVIADO", "FACTURADO", "EN_DESPACHO", "ENTREGADO"];

function sumarDias(fecha: string, dias: number, hora = "10:00"): string {
  const d = new Date(`${fecha}T${hora}:00`);
  d.setDate(d.getDate() + dias);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${hora}:00`;
}

const mensajeros = ["Domingo Cuevas", "Starlin Rosario", "Franklin Medina"];

export function precioVigente(campanaId: number, productoId: number): number {
  const item = catalogo.find((i) => i.campanaId === campanaId && i.productoId === productoId);
  if (!item) return productos.find((p) => p.id === productoId)?.precioBase ?? 0;
  return item.precioOferta ?? item.precio;
}

export const pedidos: Pedido[] = filasPedidos.map(([id, num, campanaId, vendedoraId, cliente, estado, fecha, lineas]) => {
  const historial: CambioEstado[] = [];
  if (estado === "CANCELADO") {
    historial.push({ estado: "ENVIADO", fecha: `${fecha}T09:30:00` });
    historial.push({ estado: "CANCELADO", fecha: sumarDias(fecha, 1, "11:15"), nota: "Producto descontinuado sin existencia" });
  } else {
    const hasta = orden.indexOf(estado);
    const horas = ["09:30", "15:40", "08:15", "16:50"];
    orden.slice(0, hasta + 1).forEach((e, i) => historial.push({ estado: e, fecha: sumarDias(fecha, i, horas[i]) }));
  }
  const numero = `PED-2026-${String(num).padStart(6, "0")}`;
  const facturado = orden.indexOf(estado) >= 1;
  const despachado = orden.indexOf(estado) >= 2;
  return {
    id,
    numero,
    campanaId,
    vendedoraId,
    cliente,
    lineas: lineas.map(([productoId, cantidad]) => ({ productoId, cantidad, precio: precioVigente(campanaId, productoId) })),
    estado,
    historial,
    factura: facturado ? { numero: `FAC-2026-${String(num).padStart(6, "0")}`, fecha: sumarDias(fecha, 1, "15:40") } : null,
    despacho: despachado
      ? {
          mensajero: mensajeros[id % mensajeros.length],
          guia: `GD-${String(5000 + num)}`,
          salida: sumarDias(fecha, 2, "08:15"),
          entrega: estado === "ENTREGADO" ? sumarDias(fecha, 3, "16:50") : null,
        }
      : null,
  };
});

export const pagosVendedoras: PagoVendedora[] = [
  { id: 1, vendedoraId: 1, fecha: "2026-09-24", monto: 9800, referencia: "Depósito Banreservas 448812" },
  { id: 2, vendedoraId: 1, fecha: "2026-10-14", monto: 21500, referencia: "Transferencia BHD 99120" },
  { id: 3, vendedoraId: 2, fecha: "2026-09-25", monto: 22000, referencia: "Depósito Popular 10021" },
  { id: 4, vendedoraId: 2, fecha: "2026-10-13", monto: 30000, referencia: "Transferencia Popular 11880" },
  { id: 5, vendedoraId: 5, fecha: "2026-10-12", monto: 45000, referencia: "Depósito Banreservas 451230" },
];

export function subtotalPedido(p: Pick<Pedido, "lineas">): number {
  return p.lineas.reduce((s, l) => s + l.cantidad * l.precio, 0);
}

export function nivelPara(ventas: number): NivelComision {
  return [...nivelesComision].reverse().find((n) => ventas >= n.minimo) ?? nivelesComision[0];
}

// CU060: ventas de la campaña = subtotal sin ITBIS de los pedidos no cancelados.
export function calcularComisiones(campanaId: number, lista: Pedido[]): Comision[] {
  const porVendedora = new Map<number, number>();
  lista
    .filter((p) => p.campanaId === campanaId && p.estado !== "CANCELADO")
    .forEach((p) => porVendedora.set(p.vendedoraId, (porVendedora.get(p.vendedoraId) ?? 0) + subtotalPedido(p)));
  return [...porVendedora.entries()].map(([vendedoraId, ventas]) => {
    const nivel = nivelPara(ventas);
    return {
      vendedoraId,
      campanaId,
      ventas,
      porcentaje: nivel.porcentaje,
      monto: Math.round(ventas * nivel.porcentaje) / 100,
      estado: "CALCULADA" as const,
    };
  });
}

export const comisionesIniciales: Comision[] = [
  ...calcularComisiones(1, pedidos).map((c) => ({ ...c, estado: "PAGADA" as const })),
  ...calcularComisiones(2, pedidos).map((c) => ({ ...c, estado: "APROBADA" as const })),
];
