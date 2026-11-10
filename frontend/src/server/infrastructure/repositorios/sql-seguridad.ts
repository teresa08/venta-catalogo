import type { UsuarioConCredenciales, UsuarioRepositorio } from "../../application/puertos";
import type { RolCodigo, Usuario } from "../../domain/tipos";
import { b, type BaseDatos } from "../db/base-datos";
import type { Transaccion } from "../db/transaccion";
import { aUsuario, COL } from "./mapeo";

export class SqlUsuarioRepositorio implements UsuarioRepositorio {
  constructor(private readonly db: BaseDatos, private readonly tx: Transaccion) {}

  async porEmail(email: string): Promise<UsuarioConCredenciales | null> {
    const [usuarios, permisos] = await this.db.lote([
      {
        sql: `SELECT u.id, u.nombre, u.email, u.rol_id AS rolId, u.activo, u.ultimo_acceso AS ultimoAcceso, u.clave_hash AS claveHash, r.codigo AS rol
              FROM usuario u JOIN rol r ON r.id = u.rol_id WHERE u.email = ?`,
        params: [email],
      },
      { sql: `SELECT rp.permiso FROM rol_permiso rp JOIN usuario u ON u.rol_id = rp.rol_id WHERE u.email = ?`, params: [email] },
    ]);
    const f = usuarios[0];
    if (!f) return null;
    return { ...aUsuario(f), claveHash: String(f.claveHash), rol: String(f.rol) as RolCodigo, permisos: permisos.map((p) => String(p.permiso)) };
  }

  async porId(id: number): Promise<Usuario | null> {
    const [f] = await this.db.consultar(`SELECT ${COL.usuario} FROM usuario WHERE id = ?`, [id]);
    return f ? aUsuario(f) : null;
  }

  async emailEnUso(email: string, exceptoId: number): Promise<boolean> {
    return (await this.db.consultar(`SELECT 1 FROM usuario WHERE email = ? AND id <> ?`, [email, exceptoId])).length > 0;
  }

  async rolExiste(rolId: number): Promise<boolean> {
    return (await this.db.consultar(`SELECT 1 FROM rol WHERE id = ?`, [rolId])).length > 0;
  }

  agregar(u: Omit<Usuario, "id" | "ultimoAcceso">, claveHash: string): void {
    this.tx.anotar({
      sql: `INSERT INTO usuario (nombre, email, clave_hash, rol_id, activo) VALUES (?, ?, ?, ?, ?)`,
      params: [u.nombre, u.email, claveHash, u.rolId, b(u.activo)],
    });
  }

  actualizar(u: Usuario): void {
    this.tx.anotar({
      sql: `UPDATE usuario SET nombre = ?, email = ?, rol_id = ?, activo = ? WHERE id = ?`,
      params: [u.nombre, u.email, u.rolId, b(u.activo), u.id],
    });
  }

  registrarAcceso(id: number, fecha: string): void {
    this.tx.anotar({ sql: `UPDATE usuario SET ultimo_acceso = ? WHERE id = ?`, params: [fecha, id] });
  }
}
