import { cuerpo, idDe, ruta } from "@/server/http/manejador";
import * as E from "@/server/http/esquemas";

// PUT /api/vendedoras/:id → actualiza
export const PUT = ruta<{ id: string }>(async ({ req, sesion, params, casos }) => {
  const datos = await cuerpo(req, E.vendedora);
  await casos.guardarVendedora.ejecutar(sesion, { ...datos, id: idDe(params.id) });
});
