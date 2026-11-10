import { cuerpo, ruta } from "@/server/http/manejador";
import * as E from "@/server/http/esquemas";

// CU045: POST /api/pedidos { cliente, lineas } → { numero }
export const POST = ruta(async ({ req, sesion, casos }) => {
  const { cliente, lineas } = await cuerpo(req, E.pedido);
  return { numero: await casos.enviarPedido.ejecutar(sesion, cliente, lineas) };
});
