import { idDe, ruta } from "@/server/http/manejador";

// CU030: POST /api/campanas/:id/publicar
export const POST = ruta<{ id: string }>(async ({ sesion, params, casos }) => casos.publicarCampana.ejecutar(sesion, idDe(params.id)));
