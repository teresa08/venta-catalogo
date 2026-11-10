// Entidad Campaña (CU030): solo una campaña puede estar publicada a la vez.
import { ReglaDeNegocioError } from "./errores";
import type { Campana as CampanaDatos } from "./tipos";

export class Campana {
  private constructor(private datos: CampanaDatos) {}

  static reconstruir(datos: CampanaDatos): Campana {
    return new Campana({ ...datos });
  }

  get id() { return this.datos.id; }
  get codigo() { return this.datos.codigo; }
  get estado() { return this.datos.estado; }
  get publicada() { return this.datos.estado === "PUBLICADA"; }

  publicar(): void {
    if (this.datos.estado !== "BORRADOR") {
      throw new ReglaDeNegocioError(`La campaña ${this.datos.codigo} ya fue ${this.datos.estado === "PUBLICADA" ? "publicada" : "cerrada"}`);
    }
    this.datos.estado = "PUBLICADA";
  }

  cerrar(): void {
    if (this.datos.estado !== "PUBLICADA") {
      throw new ReglaDeNegocioError(`Solo se puede cerrar la campaña publicada`);
    }
    this.datos.estado = "CERRADA";
  }

  aDatos(): CampanaDatos {
    return { ...this.datos };
  }
}
