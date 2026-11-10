// Errores del dominio y de la aplicación. El adaptador HTTP los traduce a códigos de estado.

/** Una regla de negocio no se cumple (422). */
export class ReglaDeNegocioError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ReglaDeNegocioError";
  }
}

/** El recurso pedido no existe (404). */
export class NoEncontradoError extends Error {
  constructor(recurso: string) {
    super(`${recurso} no existe`);
    this.name = "NoEncontradoError";
  }
}

/** El dato choca con otro ya registrado (409). */
export class ConflictoError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ConflictoError";
  }
}

/** No hay sesión válida (401). */
export class NoAutenticadoError extends Error {
  constructor(mensaje = "Inicia sesión para continuar") {
    super(mensaje);
    this.name = "NoAutenticadoError";
  }
}

/** La sesión no tiene el permiso necesario (403). */
export class AccesoDenegadoError extends Error {
  constructor(mensaje = "No tienes permiso para esta acción") {
    super(mensaje);
    this.name = "AccesoDenegadoError";
  }
}

export function exigir(condicion: unknown, mensaje: string): asserts condicion {
  if (!condicion) throw new ReglaDeNegocioError(mensaje);
}
