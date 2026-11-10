import { cuerpo, ruta } from "@/server/http/manejador";
import * as E from "@/server/http/esquemas";

// POST /api/categorias → crea
export const POST = ruta(async ({ req, sesion, casos }) => {
  const datos = await cuerpo(req, E.categoria);
  await casos.guardarCategoria.ejecutar(sesion, { ...datos, id: 0 });
});
