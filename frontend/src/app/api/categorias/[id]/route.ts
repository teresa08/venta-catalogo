import { cuerpo, idDe, ruta } from "@/server/http/manejador";
import * as E from "@/server/http/esquemas";

// PUT /api/categorias/:id → actualiza
export const PUT = ruta<{ id: string }>(async ({ req, sesion, params, casos }) => {
  const datos = await cuerpo(req, E.categoria);
  await casos.guardarCategoria.ejecutar(sesion, { ...datos, id: idDe(params.id) });
});
