// CU030 publicar catálogo de campaña, CU060 calcular y aprobar comisiones.
import { NoEncontradoError, ReglaDeNegocioError } from "../../domain/errores";
import { calcularComisiones } from "../../domain/reglas";
import { exigirPermiso } from "../autorizacion";
import type { CampanaRepositorio, ComisionRepositorio, PedidoRepositorio, Sesion, UnidadDeTrabajo } from "../puertos";

export class PublicarCampana {
  constructor(private readonly campanas: CampanaRepositorio, private readonly uow: UnidadDeTrabajo) {}

  /** Publica la campaña y cierra la que estaba vigente. */
  async ejecutar(sesion: Sesion | null, campanaId: number): Promise<void> {
    exigirPermiso(sesion, "campanas.publicar");
    const campana = await this.campanas.porId(campanaId);
    if (!campana) throw new NoEncontradoError("La campaña");
    if ((await this.campanas.itemsCatalogo(campanaId)).length === 0) {
      throw new ReglaDeNegocioError("La campaña no tiene productos en su catálogo");
    }
    const vigente = await this.campanas.publicada();
    campana.publicar();
    if (vigente) {
      vigente.cerrar();
      this.campanas.guardar(vigente); // primero se cierra: solo puede haber una publicada
    }
    this.campanas.guardar(campana);
    await this.uow.confirmar();
  }
}

export class CerrarCampana {
  constructor(private readonly campanas: CampanaRepositorio, private readonly uow: UnidadDeTrabajo) {}

  async ejecutar(sesion: Sesion | null, campanaId: number): Promise<void> {
    exigirPermiso(sesion, "campanas.publicar");
    const campana = await this.campanas.porId(campanaId);
    if (!campana) throw new NoEncontradoError("La campaña");
    campana.cerrar();
    this.campanas.guardar(campana);
    await this.uow.confirmar();
  }
}

export class CalcularComisiones {
  constructor(
    private readonly campanas: CampanaRepositorio,
    private readonly pedidos: PedidoRepositorio,
    private readonly comisiones: ComisionRepositorio,
    private readonly uow: UnidadDeTrabajo,
  ) {}

  async ejecutar(sesion: Sesion | null, campanaId: number): Promise<void> {
    exigirPermiso(sesion, "comisiones.calcular");
    if (!(await this.campanas.porId(campanaId))) throw new NoEncontradoError("La campaña");
    const actuales = await this.comisiones.deCampana(campanaId);
    if (actuales.some((c) => c.estado === "PAGADA")) {
      throw new ReglaDeNegocioError("Las comisiones de esta campaña ya se pagaron y no se pueden recalcular");
    }
    const ventas = await this.pedidos.ventasDeCampana(campanaId);
    const nuevas = calcularComisiones(campanaId, ventas, await this.comisiones.niveles());
    this.comisiones.reemplazar(campanaId, nuevas);
    await this.uow.confirmar();
  }
}

export class AprobarComisiones {
  constructor(private readonly comisiones: ComisionRepositorio, private readonly uow: UnidadDeTrabajo) {}

  async ejecutar(sesion: Sesion | null, campanaId: number): Promise<void> {
    exigirPermiso(sesion, "comisiones.calcular");
    const actuales = await this.comisiones.deCampana(campanaId);
    if (!actuales.some((c) => c.estado === "CALCULADA")) {
      throw new ReglaDeNegocioError("No hay comisiones calculadas pendientes de aprobar");
    }
    this.comisiones.aprobar(campanaId);
    await this.uow.confirmar();
  }
}
