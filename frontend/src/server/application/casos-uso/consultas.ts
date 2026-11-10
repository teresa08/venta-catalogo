// Lectura del estado que necesita la interfaz, según quién lo pide.
// Sin sesión: solo el catálogo público. Vendedora: solo sus datos. Administración: todo.
import type { ConsultaEstado, EstadoPrivado, EstadoPublico, Sesion } from "../puertos";

export type EstadoVisible = EstadoPublico & Partial<EstadoPrivado> & { sesionId: number | null };

export class ObtenerEstado {
  constructor(private readonly consulta: ConsultaEstado) {}

  async ejecutar(sesion: Sesion | null): Promise<EstadoVisible> {
    if (!sesion) return { ...(await this.consulta.publico()), sesionId: null };
    const esAdmin = sesion.rol === "ADMIN";
    const estado = await this.consulta.completo({
      usuarioId: esAdmin ? null : sesion.usuarioId,
      // Una vendedora sin ficha (o un cliente) no ve pedidos ajenos: -1 no coincide con nadie.
      vendedoraId: esAdmin ? null : sesion.vendedoraId ?? -1,
      verMovimientos: sesion.permisos.includes("inventario.gestionar"),
    });
    return { ...estado, sesionId: sesion.usuarioId };
  }
}
