import { cuerpo, ruta } from "@/server/http/manejador";
import * as E from "@/server/http/esquemas";

// POST /api/vendedoras → crea
export const POST = ruta(async ({ req, sesion, casos }) => {
  const datos = await cuerpo(req, E.vendedora);
  await casos.guardarVendedora.ejecutar(sesion, { ...datos, id: 0 });
});
