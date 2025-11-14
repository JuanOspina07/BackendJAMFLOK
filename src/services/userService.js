const database = require("../utils/database");

class UserService {
  async getUserById(id) {
    const [usuario] = await database.query(
      `
      SELECT 
        u.ID_USUARIOS,
        u.NombreUsuario,
        u.CorreoElectronico,
        u.ID_ROL,
        r.Nombre AS NombreRol
      FROM Usuarios u
      JOIN Roles r ON u.ID_ROL = r.ID_ROL
      WHERE u.ID_USUARIOS = ?
    `,
      [id]
    );

    if (usuario.length === 0) {
      throw new Error("Usuario no encontrado");
    }

    const [perfil] = await database.query(
      `
      SELECT 
        p.PrimerNombre,
        p.SegundoNombre,
        p.PrimerApellido,
        p.SegundoApellido,
        p.NumTelefono,
        p.FechaNacimiento,
        p.Edad,
        c.Nombre AS Ciudad,
        d.Nombre AS Departamento,
        pa.Nombre AS Pais,
        doc.Numero AS NumeroDocumento,
        td.Nombre AS TipoDocumento,
        p.ID_CIUDAD,
        p.ID_DOCUMENTO
      FROM PerfilUsuario p
      JOIN Ciudad c ON p.ID_CIUDAD = c.ID_CIUDAD
      JOIN Departamento d ON c.ID_DEPARTAMENTO = d.ID_DEPARTAMENTO
      JOIN Pais pa ON d.ID_PAIS = pa.ID_PAIS
      JOIN DocumentoIdentidad doc ON p.ID_DOCUMENTO = doc.ID_DOCUMENTO
      JOIN TipoDocumento td ON doc.ID_TIPO_DOCUMENTO = td.ID_TIPO_DOCUMENTO
      WHERE p.ID_USUARIOS = ?
    `,
      [id]
    );

    return {
      ...usuario[0],
      ...perfil[0],
    };
  }

  async updateUser(id, datosActualizados) {
    const connection = await database.getConnection();

    try {
      await connection.beginTransaction();

      // Validar existencia de IDs relacionados
      if (datosActualizados.ID_CIUDAD) {
        const [ciudad] = await connection.query(
          "SELECT 1 FROM Ciudad WHERE ID_CIUDAD = ?",
          [datosActualizados.ID_CIUDAD]
        );
        if (ciudad.length === 0) {
          throw new Error("La ciudad especificada no existe");
        }
      }

      if (datosActualizados.ID_DOCUMENTO) {
        const [documento] = await connection.query(
          "SELECT 1 FROM DocumentoIdentidad WHERE ID_DOCUMENTO = ?",
          [datosActualizados.ID_DOCUMENTO]
        );
        if (documento.length === 0) {
          throw new Error("El documento especificado no existe");
        }
      }

      // Actualizar datos en Usuarios
      if (
        datosActualizados.NombreUsuario ||
        datosActualizados.CorreoElectronico
      ) {
        await connection.query(
          `
          UPDATE Usuarios SET
            NombreUsuario = COALESCE(?, NombreUsuario),
            CorreoElectronico = COALESCE(?, CorreoElectronico)
          WHERE ID_USUARIOS = ?
        `,
          [
            datosActualizados.NombreUsuario,
            datosActualizados.CorreoElectronico,
            id,
          ]
        );
      }

      // Actualizar datos en PerfilUsuario
      await connection.query(
        `
        UPDATE PerfilUsuario SET
          PrimerNombre = COALESCE(?, PrimerNombre),
          SegundoNombre = COALESCE(?, SegundoNombre),
          PrimerApellido = COALESCE(?, PrimerApellido),
          SegundoApellido = COALESCE(?, SegundoApellido),
          NumTelefono = COALESCE(?, NumTelefono),
          FechaNacimiento = COALESCE(?, FechaNacimiento),
          Edad = COALESCE(?, Edad),
          ID_CIUDAD = COALESCE(?, ID_CIUDAD),
          ID_DOCUMENTO = COALESCE(?, ID_DOCUMENTO)
        WHERE ID_USUARIOS = ?
      `,
        [
          datosActualizados.PrimerNombre,
          datosActualizados.SegundoNombre,
          datosActualizados.PrimerApellido,
          datosActualizados.SegundoApellido,
          datosActualizados.NumTelefono,
          datosActualizados.FechaNacimiento,
          datosActualizados.Edad,
          datosActualizados.ID_CIUDAD,
          datosActualizados.ID_DOCUMENTO,
          id,
        ]
      );

      await connection.commit();
      return {
        success: true,
        message: "Datos actualizados correctamente",
        data: datosActualizados,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new UserService();
