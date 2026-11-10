// Validación de entrada del API (forma de los datos). Las reglas de negocio viven en el dominio.
import { z } from "zod";

const texto = (max: number) => z.string().trim().min(1, "Es obligatorio").max(max);
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha AAAA-MM-DD");
const id = z.number().int().nonnegative();

export const login = z.object({ email: z.string().trim().email("Correo inválido"), clave: z.string().min(1).max(200) });

export const usuario = z.object({
  id,
  nombre: texto(120),
  email: z.string().trim().toLowerCase().email("Correo inválido"),
  rolId: z.number().int().positive(),
  activo: z.boolean(),
  clave: z.string().min(8).max(200).optional(),
});

export const categoria = z.object({ id, nombre: texto(60), descripcion: z.string().trim().max(250), activa: z.boolean() });

export const producto = z.object({
  id,
  sku: texto(20),
  nombre: texto(150),
  descripcion: z.string().trim().max(500),
  categoriaId: z.number().int().positive(),
  precioBase: z.number().positive().max(10_000_000),
  activo: z.boolean(),
  tono: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color #RRGGBB"),
});

export const vendedora = z.object({
  id,
  usuarioId: z.number().int().positive().nullable(),
  codigo: z.string().optional().default(""),
  nombre: texto(120),
  cedula: texto(20),
  telefono: texto(20),
  zona: texto(60),
  fechaIngreso: fecha,
  estado: z.enum(["ACTIVA", "SUSPENDIDA", "INACTIVA"]),
});

export const pedido = z.object({
  cliente: z.string().trim().max(120),
  lineas: z.array(z.object({ productoId: z.number().int().positive(), cantidad: z.number().int().positive().max(999) })).min(1).max(100),
});

export const accionPedido = z.object({ dato: z.string().trim().max(250).optional().default("") });

export const movimiento = z.object({
  productoId: z.number().int().positive(),
  tipo: z.enum(["ENTRADA", "AJUSTE"]),
  cantidad: z.number().int(),
  referencia: texto(200),
});
