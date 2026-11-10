import { describe, expect, it } from "vitest";
import { Campana } from "../campana";
import { ReglaDeNegocioError } from "../errores";
import { Existencia } from "../inventario";
import { Pedido } from "../pedido";
import { calcularComisiones, nivelPara, precioVigente } from "../reglas";
import type { NivelComision } from "../tipos";

const nuevoPedido = () =>
  Pedido.crear({
    numero: "PED-2026-000200",
    campanaId: 3,
    vendedoraId: 1,
    cliente: "  ",
    lineas: [{ productoId: 5, cantidad: 2, precio: 425 }],
    fecha: "2026-10-21T09:00:00",
  });

describe("Pedido", () => {
  it("nace ENVIADO, con historial y cliente por defecto", () => {
    const p = nuevoPedido();
    expect(p.estado).toBe("ENVIADO");
    expect(p.aDatos().cliente).toBe("Sin nombre");
    expect(p.cambiosPendientes).toHaveLength(1);
    expect(p.subtotal).toBe(850);
  });

  it("recorre el ciclo completo", () => {
    const p = nuevoPedido();
    p.facturar("2026-10-21T10:00:00");
    expect(p.factura?.numero).toBe("FAC-2026-000200");
    p.despachar("Domingo Cuevas", "2026-10-22T08:00:00");
    expect(p.despacho?.guia).toBe("GD-5200");
    p.confirmarEntrega("2026-10-23T16:00:00");
    expect(p.estado).toBe("ENTREGADO");
    expect(p.despacho?.entrega).toBe("2026-10-23T16:00:00");
  });

  it("no permite saltarse estados ni cancelar lo despachado", () => {
    const p = nuevoPedido();
    expect(() => p.confirmarEntrega("x")).toThrow(ReglaDeNegocioError);
    p.facturar("x");
    p.despachar("M", "x");
    expect(() => p.cancelar("motivo", "x")).toThrow(ReglaDeNegocioError);
  });

  it("exige motivo para cancelar y líneas válidas para crear", () => {
    expect(() => nuevoPedido().cancelar(" ", "x")).toThrow("motivo");
    expect(() =>
      Pedido.crear({ numero: "N", campanaId: 1, vendedoraId: 1, cliente: "", lineas: [], fecha: "x" }),
    ).toThrow("no tiene productos");
  });
});

describe("Existencia", () => {
  it("reserva solo lo disponible y descuenta al despachar", () => {
    const e = Existencia.reconstruir({ productoId: 1, existencia: 10, reservado: 4, minimo: 5 });
    expect(() => e.reservar(7, "Perfume")).toThrow("Solo quedan 6");
    e.reservar(6, "Perfume");
    expect(e.disponible).toBe(0);
    e.despachar(6);
    expect(e.aDatos()).toMatchObject({ existencia: 4, reservado: 4 });
  });

  it("un ajuste no puede dejar menos que lo reservado", () => {
    const e = Existencia.reconstruir({ productoId: 1, existencia: 10, reservado: 4, minimo: 5 });
    expect(() => e.ajustar(-7)).toThrow(ReglaDeNegocioError);
    e.ajustar(-6);
    expect(e.aDatos().existencia).toBe(4);
  });
});

describe("Campaña", () => {
  it("solo se publica un borrador y solo se cierra la publicada", () => {
    const c = Campana.reconstruir({ id: 1, codigo: "C-12/2026", nombre: "N", numero: 12, anio: 2026, fechaInicio: "a", fechaFin: "b", estado: "BORRADOR" });
    expect(() => c.cerrar()).toThrow();
    c.publicar();
    expect(() => c.publicar()).toThrow();
    c.cerrar();
    expect(c.estado).toBe("CERRADA");
  });
});

describe("Reglas", () => {
  const niveles: NivelComision[] = [
    { id: 1, nombre: "Bronce", minimo: 0, maximo: 14999.99, porcentaje: 20 },
    { id: 2, nombre: "Plata", minimo: 15000, maximo: 39999.99, porcentaje: 25 },
    { id: 3, nombre: "Oro", minimo: 40000, maximo: null, porcentaje: 30 },
  ];

  it("elige el nivel por ventas", () => {
    expect(nivelPara(niveles, 14999.99).nombre).toBe("Bronce");
    expect(nivelPara(niveles, 15000).nombre).toBe("Plata");
    expect(nivelPara(niveles, 90000).nombre).toBe("Oro");
  });

  it("suma los pedidos por vendedora y aplica su porcentaje", () => {
    const r = calcularComisiones(3, [
      { vendedoraId: 1, subtotal: 30000 },
      { vendedoraId: 1, subtotal: 12000 },
      { vendedoraId: 2, subtotal: 5000 },
    ], niveles);
    expect(r).toEqual([
      { vendedoraId: 1, campanaId: 3, ventas: 42000, porcentaje: 30, monto: 12600, estado: "CALCULADA" },
      { vendedoraId: 2, campanaId: 3, ventas: 5000, porcentaje: 20, monto: 1000, estado: "CALCULADA" },
    ]);
  });

  it("la oferta tiene prioridad sobre el precio de catálogo", () => {
    const item = { campanaId: 1, productoId: 1, pagina: 4, precio: 2450, precioOferta: 2190, destacado: true };
    expect(precioVigente(item, 2450)).toBe(2190);
    expect(precioVigente({ ...item, precioOferta: null }, 999)).toBe(2450);
    expect(precioVigente(undefined, 999)).toBe(999);
  });
});
