const database = require("../utils/database");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('./emailService');
const { JWT_SECRET } = require('../config/env');

class AuthService {
  async register(userData) {
    const connection = await database.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verificar si el usuario ya existe
      const [existingUser] = await connection.execute(
        "SELECT ID_USUARIOS FROM Usuarios WHERE CorreoElectronico = ? OR NombreUsuario = ?",
        [userData.correo, userData.nombreUsuario]
      );

      if (existingUser.length > 0) {
        throw new Error("El usuario ya existe");
      }

      // Validaciones de existencia
      const [docCheck] = await connection.execute(
        "SELECT ID_TIPO_DOCUMENTO FROM TipoDocumento WHERE ID_TIPO_DOCUMENTO = ?",
        [userData.idTipoDocumento]
      );
      if (docCheck.length === 0) {
        throw new Error("El tipo de documento no existe");
      }

      const [ciudadCheck] = await connection.execute(
        "SELECT ID_CIUDAD FROM Ciudad WHERE ID_CIUDAD = ?",
        [userData.idCiudad]
      );
      if (ciudadCheck.length === 0) {
        throw new Error("La ciudad no existe");
      }

      // Insertar Documento
      const [resultDoc] = await connection.execute(
        "INSERT INTO DocumentoIdentidad (ID_TIPO_DOCUMENTO, Numero) VALUES (?, ?)",
        [userData.idTipoDocumento, userData.numeroDocumento]
      );

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(userData.contraseña, 10);

      // Insertar Usuario
      const [resultUser] = await connection.execute(
        "INSERT INTO Usuarios (ID_ROL, NombreUsuario, Contrasena, CorreoElectronico) VALUES (?, ?, ?, ?)",
        [userData.rol, userData.nombreUsuario, hashedPassword, userData.correo]
      );

      // Insertar Perfil
      await connection.execute(
        `INSERT INTO PerfilUsuario (
          ID_USUARIOS, ID_CIUDAD, ID_DOCUMENTO,
          PrimerNombre, SegundoNombre, PrimerApellido, SegundoApellido,
          Edad, FechaNacimiento, NumTelefono
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          resultUser.insertId,
          userData.idCiudad,
          resultDoc.insertId,
          userData.primerNombre,
          userData.segundoNombre,
          userData.primerApellido,
          userData.segundoApellido,
          userData.edad,
          userData.fechaNacimiento,
          userData.celular
        ]
      );

      await connection.commit();
      return { success: true, message: "Usuario registrado correctamente" };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async login(nombreUsuario, contraseña) {
    const [users] = await database.execute(
      `SELECT u.ID_USUARIOS, u.Contrasena, u.ID_ROL, 
              p.PrimerNombre, p.SegundoNombre, 
              p.PrimerApellido, p.SegundoApellido
       FROM Usuarios u
       JOIN PerfilUsuario p ON u.ID_USUARIOS = p.ID_USUARIOS
       WHERE u.NombreUsuario = ?`,
      [nombreUsuario]
    );

    if (users.length === 0) {
      throw new Error("Usuario no encontrado");
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(contraseña, user.Contrasena);
    
    if (!isPasswordValid) {
      throw new Error("Contraseña incorrecta");
    }

    const token = jwt.sign(
      { idUsuario: user.ID_USUARIOS, idRol: user.ID_ROL },
      JWT_SECRET
    );

    return {
      success: true,
      message: "Inicio de sesión exitoso",
      token,
      user: {
        idUsuario: user.ID_USUARIOS,
        idRol: user.ID_ROL,
        nombre: user.PrimerNombre + (user.SegundoNombre ? " " + user.SegundoNombre : ""),
        apellido: user.PrimerApellido + " " + user.SegundoApellido,
      },
    };
  }

  async requestPasswordReset(correo) {
    const [usuarios] = await database.execute(
      "SELECT ID_USUARIOS FROM Usuarios WHERE CorreoElectronico = ?",
      [correo]
    );

    if (usuarios.length === 0) {
      throw new Error("No se encontró un usuario con ese correo");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiration = Date.now() + 3600000;

    await database.execute(
      "UPDATE Usuarios SET TokenRecuperacion = ?, TokenExpiracion = ? WHERE CorreoElectronico = ?",
      [token, expiration, correo]
    );

    await emailService.sendPasswordResetEmail(correo, token);
    
    return { success: true, message: "Se ha enviado un enlace de recuperación a tu correo" };
  }

  async resetPassword(token, nuevaContrasena) {
    const [usuarios] = await database.execute(
      "SELECT ID_USUARIOS FROM Usuarios WHERE TokenRecuperacion = ? AND TokenExpiracion > ?",
      [token, Date.now()]
    );

    if (usuarios.length === 0) {
      throw new Error("Token inválido o expirado");
    }

    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);
    
    await database.execute(
      "UPDATE Usuarios SET Contrasena = ?, TokenRecuperacion = NULL, TokenExpiracion = NULL WHERE TokenRecuperacion = ?",
      [hashedPassword, token]
    );

    return { success: true, message: "Contraseña actualizada exitosamente" };
  }

  async validateToken(token) {
    const [user] = await database.execute(
      "SELECT ID_USUARIOS, TokenExpiracion FROM Usuarios WHERE TokenRecuperacion = ?",
      [token]
    );

    if (user.length === 0) {
      throw new Error("Token no encontrado");
    }

    if (Date.now() > user[0].TokenExpiracion) {
      throw new Error("El token ha expirado");
    }

    return { success: true, message: "Token válido" };
  }
}

module.exports = new AuthService();