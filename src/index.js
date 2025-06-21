const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const database = require("./database");
const bcrypt = require("bcryptjs"); // ✅ Se usa bcryptjs para evitar problemas

const app = express();
app.set("port", 4000);

// ✅ Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST","PUT","DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(morgan("dev"));
app.use(express.json());

// ✅ Ruta para obtener países
app.get("/api/paises", async (req, res) => {
  try {
    const [rows] = await database.query("SELECT ID_PAIS, Nombre FROM Pais");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener los países:", error);
    res.status(500).json({ error: "Error al obtener los países" });
  }
});

// ✅ Ruta para obtener departamentos por país
app.get("/api/departamentos/:idPais", async (req, res) => {
  const { idPais } = req.params;
  try {
    const [rows] = await database.query(
      "SELECT ID_DEPARTAMENTO, Nombre FROM Departamento WHERE ID_PAIS = ?",
      [idPais]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener los departamentos:", error);
    res.status(500).json({ error: "Error al obtener los departamentos" });
  }
});

// ✅ Ruta para obtener ciudades por departamento
app.get("/api/ciudades/:idDepartamento", async (req, res) => {
  const { idDepartamento } = req.params;
  try {
    const [rows] = await database.query(
      "SELECT ID_CIUDAD, Nombre FROM Ciudad WHERE ID_DEPARTAMENTO = ?",
      [idDepartamento]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener las ciudades:", error);
    res.status(500).json({ error: "Error al obtener las ciudades" });
  }
});

// ✅ Ruta para obtener los tipos de documento
app.get("/api/tipos-documento", async (req, res) => {
  try {
    const [rows] = await database.query("SELECT ID_TIPO_DOCUMENTO, Nombre FROM TipoDocumento");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener los tipos de documento:", error);
    res.status(500).json({ error: "Error al obtener los tipos de documento" });
  }
});
app.get("/api/rol", async (req, res) => {
  try {
    const [rows] = await database.query("SELECT ID_ROL, Nombre FROM Roles");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener los Roles:", error);
    res.status(500).json({ error: "Error al obtener los Roles" });
  }
});

// ✅ Ruta de registro de usuario
app.post("/api/registro", async (req, res) => {
  const {
    nombreUsuario,
    correo,
    contraseña,
    idTipoDocumento,
    numeroDocumento,
    primerNombre,
    segundoNombre,
    primerApellido,
    segundoApellido,
    edad,
    idCiudad,
    celular,
    fechaNacimiento,
    rol,
  } = req.body;

  const connection = await database.getConnection();

  try {
    await connection.beginTransaction();

    // 🔹 Verificar si el usuario ya existe
    console.log("🔍 Verificando usuario:", correo, nombreUsuario);
    const [existingUser] = await connection.execute(
      "SELECT ID_USUARIOS FROM Usuarios WHERE CorreoElectronico = ? OR NombreUsuario = ?",
      [correo, nombreUsuario]
    );
    if (existingUser.length > 0) {
      console.log("⚠️ Usuario ya existe");
      return res.status(400).json({ success: false, message: "El usuario ya existe" });
    }

    // 🔹 Validar existencia de idTipoDocumento
    const [docCheck] = await connection.execute(
      "SELECT ID_TIPO_DOCUMENTO FROM TipoDocumento WHERE ID_TIPO_DOCUMENTO = ?",
      [idTipoDocumento]
    );
    if (docCheck.length === 0) {
      return res.status(400).json({ success: false, message: "El tipo de documento no existe" });
    }

    // 🔹 Validar existencia de idCiudad
    const [ciudadCheck] = await connection.execute(
      "SELECT ID_CIUDAD FROM Ciudad WHERE ID_CIUDAD = ?",
      [idCiudad]
    );
    if (ciudadCheck.length === 0) {
      return res.status(400).json({ success: false, message: "La ciudad no existe" });
    }

    // 🔹 Insertar Documento de Identidad
    console.log("📌 Insertando Documento:", numeroDocumento, idTipoDocumento);
    const [resultDoc] = await connection.execute(
      "INSERT INTO DocumentoIdentidad (ID_TIPO_DOCUMENTO, Numero) VALUES (?, ?)",
      [idTipoDocumento, numeroDocumento]
    );
    console.log("✅ Documento insertado con ID:", resultDoc.insertId);

    // 🔹 Encriptar la contraseña
    console.log("🔐 Encriptando contraseña...");
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(contraseña, saltRounds);
    console.log("✅ Contraseña encriptada correctamente");

    // 🔹 Insertar Usuario
    console.log("📌 Insertando Usuario:", nombreUsuario, correo, rol);
    const [resultUser] = await connection.execute(
      "INSERT INTO Usuarios (ID_ROL, NombreUsuario, Contrasena, CorreoElectronico) VALUES (?, ?, ?, ?)",
      [rol, nombreUsuario, hashedPassword, correo]
    );
    console.log("✅ Usuario insertado con ID:", resultUser.insertId);

    // 🔹 Insertar Perfil de Usuario (¡aquí estaba el error!)
    console.log("📌 Insertando Perfil de Usuario...");
    await connection.execute(
      `INSERT INTO PerfilUsuario (
        ID_USUARIOS, ID_CIUDAD, ID_DOCUMENTO,
        PrimerNombre, SegundoNombre, PrimerApellido, SegundoApellido,
        Edad, FechaNacimiento, NumTelefono
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        resultUser.insertId,  // ID_USUARIOS
        idCiudad,             // ✅ ID_CIUDAD — correcto aquí
        resultDoc.insertId,   // ✅ ID_DOCUMENTO — antes estaba mal ubicado
        primerNombre,
        segundoNombre,
        primerApellido,
        segundoApellido,
        edad,
        fechaNacimiento,
        celular
      ]
    );
    console.log("✅ Perfil de usuario insertado");

    await connection.commit();
    res.json({ success: true, message: "Usuario registrado correctamente" });

  } catch (error) {
    await connection.rollback();
    console.error("❌ Error en el registro:", error);
    res.status(500).json({
      success: false,
      message: "Error en el registro",
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

//Login
app.post("/api/login", async (req, res) => {
  const { nombreUsuario, contraseña } = req.body;

  try {
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
      return res.status(401).json({ success: false, message: "Usuario no encontrado" });
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(contraseña, user.Contrasena);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
    }

   res.json({
  success: true,
  message: "Inicio de sesión exitoso",
  user: {
    idUsuario: user.ID_USUARIOS,
    idRol: user.ID_ROL,
    nombre: user.PrimerNombre + (user.SegundoNombre ? " " + user.SegundoNombre : ""),
    apellido: user.PrimerApellido + " " + user.SegundoApellido,
  },
});
  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});
const crypto = require('crypto');

const nodemailer = require("nodemailer");

// Configuración del transporte SMTP (ejemplo con Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "soportesavora@gmail.com",
    pass: "rzegtjimcbcfdcvz", // No uses la contraseña normal, usa una de aplicación
  },
});
app.post("/api/recuperar", async (req, res) => {
  const { correo } = req.body;

  if (!correo) {
    return res.status(400).json({
      success: false,
      message: "Se requiere el correo para recuperar la contraseña"
    });
  }

  try {
    const [usuarios] = await database.execute(
      "SELECT ID_USUARIOS FROM Usuarios WHERE CorreoElectronico = ?",
      [correo]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontró un usuario con ese correo"
      });
    }
    const token = crypto.randomBytes(32).toString("hex");
    const expiration = Date.now() + 3600000; // 1 hora de expiración
  
    await database.execute(
      "UPDATE Usuarios SET TokenRecuperacion = ?, TokenExpiracion = ? WHERE CorreoElectronico = ?",
      [token, expiration, correo]
    );

    const link = `http://localhost:5173/restablecer/${token}`; // Ajusta a tu dominio real en producción

    // Enviar el correo
    await transporter.sendMail({
      from: '"Soporte Jamflok" <soportesavora@gmail.com>',
      to: correo,
      subject: "🔒 Recuperación de contraseña - Jamflok",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; background: linear-gradient(135deg, #fefefe, #f5f5f5); padding: 40px;">
          <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); overflow: hidden;">
            <div style="background-color: #d4af37; padding: 20px; text-align: center;">
              <img src="https://i.ibb.co/7tGvFHxH/q.png"  alt="Savora Logo" style="height: 60px;" />
            </div>
    
            <div style="padding: 30px; text-align: center;">
              <h2 style="color: #2c3e50;">¿Olvidaste tu contraseña?</h2>
              <p style="color: #555; font-size: 16px; margin: 20px 0;">
                Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para continuar.
              </p>
    
              <a href="${link}" style="display: inline-block; padding: 14px 28px; background-color: #d4af37; color: #fff; text-decoration: none; font-size: 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); margin-top: 10px;">
                Restablecer Contraseña
              </a>
    
              <p style="font-size: 14px; color: #888; margin-top: 30px;">
                Este enlace estará activo por 1 hora. Si tú no solicitaste este cambio, puedes ignorar este mensaje con seguridad.
              </p>
            </div>
    
            <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="font-size: 13px; color: #bbb;">¿Necesitas ayuda? Escríbenos a <a href="mailto:soportesavora@gmail.com" style="color: #d4af37;">soporte@savora.com</a></p>
              <p style="font-size: 12px; color: #ccc;">Savora © ${new Date().getFullYear()} - Todos los derechos reservados</p>
            </div>
          </div>
        </div>
      `
    });

    res.json({
      success: true,
      message: "Se ha enviado un enlace de recuperación a tu correo",
    });
  } catch (error) {
    console.error("Error al enviar correo de recuperación:", error);
    res.status(500).json({
      success: false,
      message: "Error al enviar el correo de recuperación",
    });
  }
});
app.post("/api/restablecer-contrasena", async (req, res) => {
  const { token, nuevaContrasena } = req.body;

  // Validación temprana
  if (!token || !nuevaContrasena) {
    return res.status(400).json({
      success: false,
      message: "Token y nueva contraseña son obligatorios",
    });
  }

  try {
    const [usuarios] = await database.execute(
      "SELECT ID_USUARIOS FROM Usuarios WHERE TokenRecuperacion = ? AND TokenExpiracion > ?",
      [token, Date.now()]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Token inválido o expirado",
      });
    }

    // Encripta la nueva contraseña
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

    // IMPORTANTE: Verifica que los valores no estén undefined
    if (!hashedPassword || !token) {
      return res.status(400).json({
        success: false,
        message: "Error interno: parámetros no válidos",
      });
    }

    await database.execute(
      "UPDATE Usuarios SET Contrasena = ?, TokenRecuperacion = NULL, TokenExpiracion = NULL WHERE TokenRecuperacion = ?",
      [hashedPassword, token]
    );

    res.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error al restablecer la contraseña:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor al restablecer la contraseña",
    });
  }
});

// Ruta para validar el token y mostrar el formulario de cambio de contraseña
app.get("/restablecer/:token", async (req, res) => {
  const { token } = req.params;
  try {
    const [user] = await database.execute(
      "SELECT ID_USUARIOS, TokenExpiracion FROM Usuarios WHERE TokenRecuperacion = ?",
      [token]
    );

    if (user.length === 0) {
      return res.status(400).json({ success: false, message: "Token no encontrado" });
    }

    const expiration = user[0].TokenExpiracion;
    if (Date.now() > expiration) {
      return res.status(400).json({ success: false, message: "El token ha expirado" });
    }

    res.json({ success: true, message: "Token válido" });
  } catch (error) {
    console.error("Error al verificar el token:", error);
    res.status(500).json({ success: false, message: "Error al verificar el token" });
  }
});
app.get("/api/negocios/:idUsuario", async (req, res) => {
  const { idUsuario } = req.params;

  try {
    const [rows] = await database.query(
      `SELECT 
         n.ID_NEGOCIOS, 
         n.NombreNegocio, 
         n.Descripcion, 
         c.Nombre AS Ciudad,       -- ← Trae el nombre de la ciudad
         n.Direccion, 
         n.Horario, 
         n.NumTelefono AS Telefono, 
         n.RUT,
         n.Imagen
       FROM negocios n
       JOIN ciudad c ON n.ID_CIUDAD = c.ID_CIUDAD  -- ← Relación entre negocio y ciudad
       WHERE n.ID_USUARIOS = ?`,
      [idUsuario]
    );

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "No se encontraron negocios para este usuario" });
    }

    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener los negocios:", error);
    res.status(500).json({ error: "Error al obtener los negocios" });
  }
});
app.get("/api/categorias", async (req, res) => {
  try {
    const [filas] = await database.execute("SELECT ID_CATEGORIAS, NombreCategoria FROM categorias");
    res.json(filas);
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    res.status(500).json({ message: "Error interno al obtener categorías" });
  }
});
app.post("/api/negociosnuevo", async (req, res) => {
  const {
    ID_USUARIOS,
    ID_CATEGORIA,
    ID_CIUDAD,
    NombreNegocio,
    RUT,
    Descripcion,
    Direccion,
    NumTelefono,
    Horario,
    Imagen,
  } = req.body;

  if (!ID_USUARIOS || !ID_CATEGORIA || !ID_CIUDAD || !NombreNegocio) {
    return res.status(400).json({ success: false, message: "Faltan campos obligatorios" });
  }

  try {
    await database.execute(
      `INSERT INTO Negocios 
        (ID_USUARIOS, ID_CATEGORIA, ID_CIUDAD, NombreNegocio, RUT, Descripcion, Direccion, NumTelefono, Horario, Imagen)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ID_USUARIOS,
        ID_CATEGORIA,
        ID_CIUDAD,
        NombreNegocio,
        RUT,
        Descripcion,
        Direccion,
        NumTelefono,
        Horario,
        Imagen,
      ]
    );

    res.json({ success: true, message: "Negocio guardado exitosamente" });
  } catch (error) {
    console.error("❌ Error al guardar negocio:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});

// Obtener datos de un negocio por ID
app.get('/api/negocio/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const [rows] = await database.execute(`
      SELECT n.*, c.Nombre AS Ciudad
      FROM Negocios n
      JOIN Ciudad c ON n.ID_CIUDAD = c.ID_CIUDAD
      WHERE n.ID_NEGOCIOS = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Negocio no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("❌ Error al obtener negocio por ID:", error);
    res.status(500).json({ message: "Error interno al obtener el negocio" });
  }
});
app.get('/api/productos/negocio/:idNegocio', async (req, res) => {
  const idNegocio = req.params.idNegocio;

  try {
    const [rows] = await database.execute(
      `SELECT * FROM Productos WHERE ID_NEGOCIOS = ?`, [idNegocio]
    );

    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener productos:", error);
    res.status(500).json({ message: "Error interno al obtener productos" });
  }
});

app.post('/api/productosnuevo', async (req, res) => {
  try {
    const { ID_NEGOCIOS, Nombre, Descripcion, Precio, Imagen } = req.body;

    if (!ID_NEGOCIOS || !Nombre || !Descripcion || !Precio) {
      return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }

    const [result] = await database.execute(
      `INSERT INTO Productos (ID_NEGOCIOS, NombreProducto, Descripcion, Precio, Imagen)
       VALUES (?, ?, ?, ?, ?)`,
      [ID_NEGOCIOS, Nombre, Descripcion, Precio, Imagen]
    );

    res.status(201).json({ message: "Producto creado exitosamente", id: result.insertId });
  } catch (error) {
    console.error("❌ Error al insertar producto:", error);
    res.status(500).json({ message: "Error interno al guardar producto" });
  }
});

// Obtener reseñas de un negocio por ID
app.get('/api/resenas/negocio/:id', async (req, res) => {
  const idNegocio = req.params.id;
  try {
    const [rows] = await database.query(`
      SELECT r.ID_RESENA, r.ID_CALIFICACION, r.Descripcion, c.NumEstrellas 
      FROM Resenas r 
      JOIN Calificacion c ON r.ID_CALIFICACION = c.ID_CALIFICACION 
      WHERE r.ID_NEGOCIO = ?
    `, [idNegocio]);

    res.json(rows);
  } catch (error) {
    console.error('❌ Error al obtener reseñas:', error);
    res.status(500).json({ error: 'Error al obtener reseñas' });
  }
});
app.get("/api/negocios", async (req, res) => {
  try {
    const [rows] = await database.query(`
      SELECT 
        ID_NEGOCIOS,
        ID_USUARIOS,
        ID_CATEGORIA,
        ID_CIUDAD,
        NombreNegocio,
        RUT,
        Descripcion,
        Direccion,
        NumTelefono,
        Horario,
        Imagen
      FROM Negocios
    `);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener negocios:", error);
    res.status(500).json({ error: "Error al obtener negocios" });
  }
});



// ✅ Iniciar el servidor
app.listen(4000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:4000");
});
