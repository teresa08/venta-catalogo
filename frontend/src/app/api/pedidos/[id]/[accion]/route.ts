import { NoEncontradoError } from "@/server/domain/errores";
import type { AccionPedido } from "@/server/application/casos-uso/pedidos";
import { cuerpo, idDe, ruta } from "@/server/http/manejador";
import * as E from "@/server/http/esquemas";

const ACCIONES: AccionPedido[] = ["facturar", "despachar", "entregar", "cancelar"];

// CU075/CU080: POST /api/pedidos/:id/{facturar|despachar|entregar|cancelar} { dato? }
// "dato" es el mensajero al despachar o el motivo al cancelar.
export const POST = ruta<{ id: string; accion: string }>(async ({ req, sesion, params, casos }) => {
  const accion = params.accion as AccionPedido;
  if (!ACCIONES.includes(accion)) throw new NoEncontradoError("La acción");
  const { dato } = await cuerpo(req, E.accionPedido);
  await casos.cambiarEstadoPedido.ejecutar(sesion, idDe(params.id), accion, dato);
});
