import { cuerpo, ruta } from "@/server/http/manejador";
import * as E from "@/server/http/esquemas";

// CU010: POST /api/auth/login  { email, clave } → { token, usuario }
export const POST = ruta(async ({ req, casos }) => {
  const { email, clave } = await cuerpo(req, E.login);
  return casos.iniciarSesion.ejecutar(email, clave);
});
