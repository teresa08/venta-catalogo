// JWT HS256 con node:crypto, sin dependencias externas.
import { createHmac, timingSafeEqual } from "node:crypto";
import type { EmisorTokens, Sesion } from "../../application/puertos";

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export class JwtEmisorTokens implements EmisorTokens {
  constructor(private readonly secreto: string, private readonly duracionSegundos = 8 * 60 * 60) {
    if (secreto.length < 32) throw new Error("JWT_SECRET debe tener al menos 32 caracteres");
  }

  async emitir(s: Sesion): Promise<string> {
    const ahora = Math.floor(Date.now() / 1000);
    const cabecera = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const cuerpo = b64url(
      JSON.stringify({ sub: String(s.usuarioId), rol: s.rol, permisos: s.permisos, vendedoraId: s.vendedoraId, iat: ahora, exp: ahora + this.duracionSegundos }),
    );
    return `${cabecera}.${cuerpo}.${this.firmar(`${cabecera}.${cuerpo}`)}`;
  }

  async verificar(token: string): Promise<Sesion | null> {
    const [cabecera, cuerpo, firma] = token.split(".");
    if (!cabecera || !cuerpo || !firma) return null;
    const esperada = Buffer.from(this.firmar(`${cabecera}.${cuerpo}`));
    const recibida = Buffer.from(firma);
    if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;
    try {
      const { alg } = JSON.parse(Buffer.from(cabecera, "base64url").toString());
      const c = JSON.parse(Buffer.from(cuerpo, "base64url").toString());
      if (alg !== "HS256" || typeof c.exp !== "number" || c.exp < Date.now() / 1000) return null;
      return { usuarioId: Number(c.sub), rol: c.rol, permisos: c.permisos ?? [], vendedoraId: c.vendedoraId ?? null };
    } catch {
      return null;
    }
  }

  private firmar(datos: string): string {
    return createHmac("sha256", this.secreto).update(datos).digest("base64url");
  }
}
