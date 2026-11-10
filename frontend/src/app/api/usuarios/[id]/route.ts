import { cuerpo, idDe, ruta } from "@/server/http/manejador";
import * as E from "@/server/http/esquemas";

// PUT /api/usuarios/:id → actualiza
export const PUT = ruta<{ id: string }>(async ({ req, sesion, params, casos }) => {
  const datos = await cuerpo(req, E.usuario);
  await casos.guardarUsuario.ejecutar(sesion, { ...datos, id: idDe(params.id) });
});
