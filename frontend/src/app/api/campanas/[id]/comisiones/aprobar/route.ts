import { idDe, ruta } from "@/server/http/manejador";

// CU060: POST /api/campanas/:id/comisiones/aprobar
export const POST = ruta<{ id: string }>(async ({ sesion, params, casos }) => casos.aprobarComisiones.ejecutar(sesion, idDe(params.id)));
