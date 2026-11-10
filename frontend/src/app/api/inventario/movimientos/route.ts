import { cuerpo, ruta } from "@/server/http/manejador";
import * as E from "@/server/http/esquemas";

// CU070: POST /api/inventario/movimientos { productoId, tipo, cantidad, referencia }
export const POST = ruta(async ({ req, sesion, casos }) => casos.registrarMovimiento.ejecutar(sesion, await cuerpo(req, E.movimiento)));
