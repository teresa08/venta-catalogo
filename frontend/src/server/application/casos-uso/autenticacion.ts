// CU010: autenticar usuario.
import { NoAutenticadoError } from "../../domain/errores";
import type { Usuario } from "../../domain/tipos";
import type { CifradorClaves, EmisorTokens, Reloj, UnidadDeTrabajo, UsuarioRepositorio, VendedoraRepositorio } from "../puertos";

export interface ResultadoInicioSesion {
  token: string;
  usuario: Usuario;
}

const CREDENCIALES_INVALIDAS = "El correo o la contraseña no coinciden. Revisa los datos e inténtalo de nuevo.";

export class IniciarSesion {
  constructor(
    private readonly usuarios: UsuarioRepositorio,
    private readonly vendedoras: VendedoraRepositorio,
    private readonly cifrador: CifradorClaves,
    private readonly tokens: EmisorTokens,
    private readonly reloj: Reloj,
    private readonly uow: UnidadDeTrabajo,
  ) {}

  async ejecutar(email: string, clave: string): Promise<ResultadoInicioSesion> {
    const u = await this.usuarios.porEmail(email.trim().toLowerCase());
    // Se verifica la clave aunque el usuario no exista para no revelar qué correos están registrados.
    const valida = await this.cifrador.verificar(clave, u?.claveHash ?? "pbkdf2_sha256$1$AAAA$AAAA");
    if (!u || !valida) throw new NoAutenticadoError(CREDENCIALES_INVALIDAS);
    if (!u.activo) throw new NoAutenticadoError("Este usuario está desactivado. Pide a la administración que lo reactive.");

    const vendedora = await this.vendedoras.porUsuario(u.id);
    const fecha = this.reloj.ahora();
    this.usuarios.registrarAcceso(u.id, fecha);
    await this.uow.confirmar();

    const token = await this.tokens.emitir({ usuarioId: u.id, rol: u.rol, permisos: u.permisos, vendedoraId: vendedora?.id ?? null });
    return {
      token,
      usuario: { id: u.id, nombre: u.nombre, email: u.email, rolId: u.rolId, activo: u.activo, ultimoAcceso: fecha },
    };
  }
}
