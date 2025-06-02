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
      "INSERT INTO DocumentoIdentidad (ID_TIPO_DOCUMENTO,numero) VALUES (?, ?)",
      [idTipoDocumento,numeroDocumento]
    );
    console.log("✅ Documento insertado con ID:", resultDoc.insertId);

    // 🔹 Encriptar la contraseña
    console.log("🔐 Encriptando contraseña...");
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(contraseña, saltRounds);
    console.log("✅ Contraseña encriptada correctamente");

    // 🔹 Insertar Usuario
    console.log("📌 Insertando Usuario:", nombreUsuario, correo,rol);
    const [resultUser] = await connection.execute(
      "INSERT INTO Usuarios (ID_ROL,NombreUsuario, Contrasena,CorreoElectronico) VALUES (?, ?, ?, ?)",
      [rol,nombreUsuario, hashedPassword,correo,]
    );
    console.log("✅ Usuario insertado con ID:", resultUser.insertId);

    // 🔹 Insertar Perfil de Usuario
    console.log("📌 Insertando Perfil de Usuario...");
    await connection.execute(
      "INSERT INTO PerfilUsuario (ID_USUARIOS,ID_CIUDAD,ID_DOCUMENTO, PrimerNombre, SegundoNombre, PrimerApellido, SegundoApellido, Edad, FechaNacimiento,NumTelefono) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [resultUser.insertId, resultDoc.insertId,idCiudad, primerNombre, segundoNombre, primerApellido, segundoApellido, edad, fechaNacimiento,celular]
    );
    console.log("✅ Perfil de usuario insertado");

    await connection.commit();
    res.json({ success: true, message: "Usuario registrado correctamente" });
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error en el registro:", error);
    res.status(500).json({ success: false, message: "Error en el registro", error: error.message });
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

// ✅ Iniciar el servidor
app.listen(4000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:4000");
});
