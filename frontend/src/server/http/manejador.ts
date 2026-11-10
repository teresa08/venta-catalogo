// Adaptador de entrada HTTP: lee la sesión, valida el cuerpo y traduce los errores a respuestas.
import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodTypeAny, type output } from "zod";
import type { Sesion } from "../application/puertos";
import { casosDeUso, emisorTokens, type CasosDeUso } from "../contenedor";
import { AccesoDenegadoError, ConflictoError, NoAutenticadoError, NoEncontradoError, ReglaDeNegocioError } from "../domain/errores";

export interface Contexto<P> {
  req: NextRequest;
  sesion: Sesion | null;
  params: P;
  casos: CasosDeUso;
}

type Manejador<P> = (ctx: Contexto<P>) => Promise<unknown>;

export function ruta<P = Record<string, never>>(fn: Manejador<P>) {
  return async (req: NextRequest, segmento: { params: Promise<P> }) => {
    try {
      const sesion = await leerSesion(req);
      const resultado = await fn({ req, sesion, params: await segmento?.params, casos: casosDeUso() });
      return resultado === undefined ? new NextResponse(null, { status: 204 }) : NextResponse.json(resultado);
    } catch (e) {
      return aRespuesta(e);
    }
  };
}

/** Lee y valida el cuerpo JSON con un esquema zod. */
export async function cuerpo<S extends ZodTypeAny>(req: NextRequest, esquema: S): Promise<output<S>> {
  const json = await req.json().catch(() => {
    throw new ReglaDeNegocioError("El cuerpo de la petición no es JSON válido");
  });
  return esquema.parse(json);
}

/** Convierte el segmento [id] de la URL en un entero positivo. */
export function idDe(valor: string): number {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new NoEncontradoError("El recurso");
  return id;
}

async function leerSesion(req: NextRequest): Promise<Sesion | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const sesion = await emisorTokens().verificar(auth.slice(7));
  if (!sesion) throw new NoAutenticadoError("Tu sesión venció. Inicia sesión de nuevo.");
  return sesion;
}

function aRespuesta(e: unknown): NextResponse {
  const json = (status: number, error: string, detalles?: unknown) => NextResponse.json({ error, detalles }, { status });
  if (e instanceof ZodError) return json(400, "Datos inválidos", e.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message })));
  if (e instanceof NoAutenticadoError) return json(401, e.message);
  if (e instanceof AccesoDenegadoError) return json(403, e.message);
  if (e instanceof NoEncontradoError) return json(404, e.message);
  if (e instanceof ConflictoError) return json(409, e.message);
  if (e instanceof ReglaDeNegocioError) return json(422, e.message);
  console.error(e);
  return json(500, "Ocurrió un error inesperado. Inténtalo de nuevo.");
}
