import { idDe, ruta } from "@/server/http/manejador";

// CU060: POST /api/campanas/:id/comisiones → calcula (o recalcula) la liquidación
export const POST = ruta<{ id: string }>(async ({ sesion, params, casos }) => casos.calcularComisiones.ejecutar(sesion, idDe(params.id)));
