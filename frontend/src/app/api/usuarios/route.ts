import { cuerpo, ruta } from "@/server/http/manejador";
import * as E from "@/server/http/esquemas";

// POST /api/usuarios → crea
export const POST = ruta(async ({ req, sesion, casos }) => {
  const datos = await cuerpo(req, E.usuario);
  await casos.guardarUsuario.ejecutar(sesion, { ...datos, id: 0 });
});
