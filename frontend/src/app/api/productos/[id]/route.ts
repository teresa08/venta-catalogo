import { cuerpo, idDe, ruta } from "@/server/http/manejador";
import * as E from "@/server/http/esquemas";

// PUT /api/productos/:id → actualiza
export const PUT = ruta<{ id: string }>(async ({ req, sesion, params, casos }) => {
  const datos = await cuerpo(req, E.producto);
  await casos.guardarProducto.ejecutar(sesion, { ...datos, id: idDe(params.id) });
});
