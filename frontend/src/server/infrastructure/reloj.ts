import type { Reloj } from "../application/puertos";

const formato = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "America/Santo_Domingo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** Hora local de República Dominicana, que es la que ve el personal en las pantallas. */
export class RelojSantoDomingo implements Reloj {
  ahora(): string {
    return formato.format(new Date()).replace(" ", "T");
  }
}
