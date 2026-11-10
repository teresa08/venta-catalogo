import { idDe, ruta } from "@/server/http/manejador";

// POST /api/campanas/:id/cerrar
export const POST = ruta<{ id: string }>(async ({ sesion, params, casos }) => casos.cerrarCampana.ejecutar(sesion, idDe(params.id)));
