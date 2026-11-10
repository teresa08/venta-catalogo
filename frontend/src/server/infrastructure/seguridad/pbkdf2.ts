// Contraseñas con PBKDF2-SHA256 (node:crypto). Formato: pbkdf2_sha256$iteraciones$sal$hash (base64).
import { pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { CifradorClaves } from "../../application/puertos";

const derivar = promisify(pbkdf2);
const ITERACIONES = 100_000;

export class Pbkdf2CifradorClaves implements CifradorClaves {
  async cifrar(clave: string): Promise<string> {
    const sal = randomBytes(16);
    const hash = await derivar(clave, sal, ITERACIONES, 32, "sha256");
    return `pbkdf2_sha256$${ITERACIONES}$${sal.toString("base64")}$${hash.toString("base64")}`;
  }

  async verificar(clave: string, guardado: string): Promise<boolean> {
    const [algoritmo, iter, sal, hash] = guardado.split("$");
    if (algoritmo !== "pbkdf2_sha256" || !iter || !sal || !hash) return false;
    const esperado = Buffer.from(hash, "base64");
    const calculado = await derivar(clave, Buffer.from(sal, "base64"), Number(iter), esperado.length || 32, "sha256");
    return esperado.length === calculado.length && timingSafeEqual(esperado, calculado);
  }
}
