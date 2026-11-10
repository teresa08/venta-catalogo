import { ruta } from "@/server/http/manejador";

export const dynamic = "force-dynamic";

// GET /api/estado → datos visibles para la sesión (sin sesión: solo el catálogo público).
export const GET = ruta(async ({ sesion, casos }) => casos.obtenerEstado.ejecutar(sesion));
