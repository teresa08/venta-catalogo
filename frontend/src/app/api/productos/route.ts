import { cuerpo, ruta } from "@/server/http/manejador";
import * as E from "@/server/http/esquemas";

// POST /api/productos → crea
export const POST = ruta(async ({ req, sesion, casos }) => {
  const datos = await cuerpo(req, E.producto);
  await casos.guardarProducto.ejecutar(sesion, { ...datos, id: 0 });
});
