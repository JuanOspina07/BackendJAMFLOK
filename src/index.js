const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const database = require("./database");
const bcrypt = require("bcryptjs");
const app = express();
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
app.set("port", 4000);
const jwt = require('jsonwebtoken');

// ✅ Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST","PUT","DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("dev"));
app.use(express.json());

// Clave secreta para JWT (en producción, usa variable de entorno)
const JWT_SECRET = "your_jwt_secret_key";

// Middleware para verificar el token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error al verificar token:", error);
    res.status(401).json({ success: false, message: "Token inválido" });
  }
};

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

    // 🔹 Insertar Perfil de Usuario
    console.log("📌 Insertando Perfil de Usuario...");
    await connection.execute(
      `INSERT INTO PerfilUsuario (
        ID_USUARIOS, ID_CIUDAD, ID_DOCUMENTO,
        PrimerNombre, SegundoNombre, PrimerApellido, SegundoApellido,
        Edad, FechaNacimiento, NumTelefono
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        resultUser.insertId,
        idCiudad,
        resultDoc.insertId,
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

// Login
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

    // Generar token JWT sin expiración
    const token = jwt.sign(
      { idUsuario: user.ID_USUARIOS, idRol: user.ID_ROL },
      JWT_SECRET
    );

    res.json({
      success: true,
      message: "Inicio de sesión exitoso",
      token,
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

// Configuración del transporte SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "soportesavora@gmail.com",
    pass: "yrxabkbimtpswnrx",
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
    const expiration = Date.now() + 3600000;
  
    await database.execute(
      "UPDATE Usuarios SET TokenRecuperacion = ?, TokenExpiracion = ? WHERE CorreoElectronico = ?",
      [token, expiration, correo]
    );

    const link = `http://localhost:5173/restablecer/${token}`;

    await transporter.sendMail({
      from: '"Soporte Jamflok" <soportesavora@gmail.com>',
      to: correo,
      subject: "🔒 Recuperación de contraseña - Jamflok",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; background: linear-gradient(135deg, #fefefe, #f5f5f5); padding: 40px;">
          <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); overflow: hidden;">
            <div style="background-color: #d4af37; padding: 20px; text-align: center;">
              <img src="https://i.ibb.co/7tGvFHxH/q.png" alt="Savora Logo" style="height: 60px;" />
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

    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

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
         c.Nombre AS Ciudad,
         n.Direccion, 
         n.Horario, 
         n.NumTelefono AS Telefono, 
         n.RUT,
         n.Imagen
       FROM negocios n
       JOIN ciudad c ON n.ID_CIUDAD = c.ID_CIUDAD
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
app.get('/api/negocios/:id', async (req, res) => {
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

// Ruta para procesar pagos
app.post("/api/pagos", verifyToken, async (req, res) => {
  const { productos, metodoPago } = req.body;
  const idUsuario = req.user.idUsuario;

  if (!productos || !Array.isArray(productos) || productos.length === 0 || !metodoPago) {
    console.error("Datos de pago incompletos:", { productos, metodoPago });
    return res.status(400).json({
      success: false,
      message: "Datos de pago incompletos o inválidos",
    });
  }

  for (const producto of productos) {
    if (
      !producto.idProducto ||
      !Number.isInteger(producto.cantidad) ||
      producto.cantidad <= 0 ||
      !producto.precioUnitario ||
      producto.precioUnitario <= 0
    ) {
      console.error("Datos de producto inválidos:", producto);
      return res.status(400).json({
        success: false,
        message: "Datos de producto inválidos: cantidad y precio deben ser positivos",
      });
    }
  }

  const connection = await database.getConnection();

  try {
    await connection.beginTransaction();

    console.log("Validando usuario con ID:", idUsuario);
    const [userCheck] = await connection.query(
      "SELECT ID_USUARIOS FROM Usuarios WHERE ID_USUARIOS = ?",
      [idUsuario]
    );
    if (userCheck.length === 0) {
      console.error("Usuario no encontrado para ID:", idUsuario);
      throw new Error("El usuario no existe");
    }

    for (const producto of productos) {
      const [productCheck] = await connection.query(
        "SELECT ID_PRODUCTOS FROM Productos WHERE ID_PRODUCTOS = ?",
        [producto.idProducto]
      );
      if (productCheck.length === 0) {
        console.error("Producto no encontrado para ID:", producto.idProducto);
        throw new Error(`El producto con ID ${producto.idProducto} no existe`);
      }
    }

    const [pagoResult] = await connection.query("INSERT INTO Pago (MetodoPago) VALUES (?)", [metodoPago]);
    const idPago = pagoResult.insertId;

    const [facturaResult] = await connection.query(
      "INSERT INTO Factura (ID_USUARIOS, ID_PAGO, FechaPago) VALUES (?, ?, NOW())",
      [idUsuario, idPago]
    );
    const idFactura = facturaResult.insertId;

    for (const producto of productos) {
      await connection.query(
        "INSERT INTO FacturaDetalle (ID_FACTURA, ID_PRODUCTOS, Monto, Cantidad) VALUES (?, ?, ?, ?)",
        [idFactura, producto.idProducto, producto.precioUnitario, producto.cantidad]
      );
    }

    await connection.commit();

    console.log("Pago procesado correctamente. ID Factura:", idFactura);
    res.json({
      success: true,
      idFactura,
      message: "Pago procesado correctamente",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error en la transacción de pago:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error al procesar el pago",
    });
  } finally {
    connection.release();
  }
});

// Ruta para obtener una factura por ID
app.get("/api/facturas/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [factura] = await database.query(
      `SELECT f.ID_FACTURA, f.ID_USUARIOS, f.ID_PAGO, f.FechaPago,
              fd.ID_FACTURA_DETALLE, fd.ID_PRODUCTOS, fd.Monto AS PrecioUnitario, fd.Cantidad,
              p.NombreProducto,
              SUM(fd.Monto * fd.Cantidad) AS Total
       FROM Factura f
       JOIN FacturaDetalle fd ON f.ID_FACTURA = fd.ID_FACTURA
       JOIN Productos p ON fd.ID_PRODUCTOS = p.ID_PRODUCTOS
       WHERE f.ID_FACTURA = ?
       GROUP BY f.ID_FACTURA, fd.ID_FACTURA_DETALLE`,
      [id]
    );
    if (!factura.length) {
      return res.status(404).json({ success: false, message: "Factura no encontrada" });
    }
    res.json(factura);
  } catch (error) {
    console.error("Error al obtener la factura:", error);
    res.status(500).json({ success: false, message: "Error al obtener la factura" });
  }
});

// Ruta para descargar la factura en PDF
app.get("/api/facturas/:id/descargar", async (req, res) => {
  const { id } = req.params;
  try {
    const [factura] = await database.query(
      `SELECT f.ID_FACTURA, f.FechaPago,
              fd.ID_PRODUCTOS, fd.Monto AS PrecioUnitario, fd.Cantidad,
              p.NombreProducto
       FROM Factura f
       JOIN FacturaDetalle fd ON f.ID_FACTURA = fd.ID_FACTURA
       JOIN Productos p ON fd.ID_PRODUCTOS = p.ID_PRODUCTOS
       WHERE f.ID_FACTURA = ?`,
      [id]
    );

    if (!factura.length) {
      return res.status(404).json({ success: false, message: "Factura no encontrada" });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=factura-${id}.pdf`);
    doc.pipe(res);

    const logoPath = path.join(__dirname, "assets/Logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 50, { width: 80 });
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(25)
      .fillColor("#2c3e50")
      .text(`Factura #${factura[0].ID_FACTURA}`, 200, 50, { align: "right" });
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#2c3e50")
      .text(`Fecha: ${new Date(factura[0].FechaPago).toLocaleString()}`, 200, 80, { align: "right" });

    doc
      .strokeColor("#d4af37")
      .lineWidth(2)
      .moveTo(50, 120)
      .lineTo(550, 120)
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#d4af37")
      .text("Detalles de la Compra", 50, 140);
    let y = 170;
    let total = 0;
    factura.forEach((detalle, index) => {
      const precioUnitario = Math.floor(detalle.PrecioUnitario);
      const subtotal = Math.floor(precioUnitario * detalle.Cantidad);
      total += subtotal;
      doc
        .font("Helvetica")
        .fontSize(12)
        .fillColor("#2c3e50")
        .text(detalle.NombreProducto, 50, y)
        .text(`Cantidad: ${detalle.Cantidad}`, 250, y)
        .text(`$${precioUnitario} c/u`, 350, y)
        .text(`$${new Intl.NumberFormat("es-CO").format(subtotal)}`, 450, y, { align: "right" });
      y += 25;
      if (index < factura.length - 1) {
        doc
          .strokeColor("#e0e0e0")
          .lineWidth(1)
          .moveTo(50, y - 5)
          .lineTo(550, y - 5)
          .stroke();
      }
    });

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#d4af37")
      .text(`Total: $${new Intl.NumberFormat("es-CO").format(total)}`, 50, y + 20, { align: "right" });

    doc.end();
  } catch (error) {
    console.error("Error al generar el PDF:", error);
    res.status(500).json({ success: false, message: "Error al generar el PDF" });
  }
});



// ✅ Obtener datos del usuario
app.get('/api/usuario/:id', async (req, res) => {
  const { id } = req.params;
  console.log("📥 Datos recibidos en PUT:", req.body);
  try {
    const [usuario] = await database.query(`
      SELECT 
        u.ID_USUARIOS,
        u.NombreUsuario,
        u.CorreoElectronico,
        u.ID_ROL,
        r.Nombre AS NombreRol
      FROM Usuarios u
      JOIN Roles r ON u.ID_ROL = r.ID_ROL
      WHERE u.ID_USUARIOS = ?
    `, [id]);

    if (usuario.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const [perfil] = await database.query(`
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
        td.Nombre AS TipoDocumento
      FROM PerfilUsuario p
      JOIN Ciudad c ON p.ID_CIUDAD = c.ID_CIUDAD
      JOIN Departamento d ON c.ID_DEPARTAMENTO = d.ID_DEPARTAMENTO
      JOIN Pais pa ON d.ID_PAIS = pa.ID_PAIS
      JOIN DocumentoIdentidad doc ON p.ID_DOCUMENTO = doc.ID_DOCUMENTO
      JOIN TipoDocumento td ON doc.ID_TIPO_DOCUMENTO = td.ID_TIPO_DOCUMENTO
      WHERE p.ID_USUARIOS = ?
    `, [id]);

    const datosUsuario = {
      ...usuario[0],
      ...perfil[0]
    };

    res.json(datosUsuario);
  } catch (error) {
    console.error('❌ Error al obtener datos del usuario:', error);
    res.status(500).json({ error: 'Error al obtener datos del usuario' });
  }
});


// ✅ Actualizar datos del usuario (pégalo después del GET)
app.put('/api/usuario/:id', async (req, res) => {
  const { id } = req.params;
  const datosActualizados = req.body;

  console.log("📥 Datos recibidos para actualizar:", datosActualizados);

  // Validación de fecha
  if (datosActualizados.FechaNacimiento && !/^\d{4}-\d{2}-\d{2}$/.test(datosActualizados.FechaNacimiento)) {
    return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD' });
  }

  const connection = await database.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Validar existencia de IDs relacionados
    if (datosActualizados.ID_CIUDAD) {
      const [ciudad] = await connection.query('SELECT 1 FROM Ciudad WHERE ID_CIUDAD = ?', [datosActualizados.ID_CIUDAD]);
      if (ciudad.length === 0) {
        throw new Error('La ciudad especificada no existe');
      }
    }

    if (datosActualizados.ID_DOCUMENTO) {
      const [documento] = await connection.query('SELECT 1 FROM DocumentoIdentidad WHERE ID_DOCUMENTO = ?', [datosActualizados.ID_DOCUMENTO]);
      if (documento.length === 0) {
        throw new Error('El documento especificado no existe');
      }
    }

    // 2. Actualizar datos en Usuarios
    if (datosActualizados.NombreUsuario || datosActualizados.CorreoElectronico) {
      await connection.query(`
        UPDATE Usuarios SET
          NombreUsuario = COALESCE(?, NombreUsuario),
          CorreoElectronico = COALESCE(?, CorreoElectronico)
        WHERE ID_USUARIOS = ?
      `, [
        datosActualizados.NombreUsuario,
        datosActualizados.CorreoElectronico,
        id
      ]);
    }

    // 3. Actualizar datos en PerfilUsuario
    await connection.query(`
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
    `, [
      datosActualizados.PrimerNombre,
      datosActualizados.SegundoNombre,
      datosActualizados.PrimerApellido,
      datosActualizados.SegundoApellido,
      datosActualizados.NumTelefono,
      datosActualizados.FechaNacimiento,
      datosActualizados.Edad,
      datosActualizados.ID_CIUDAD,
      datosActualizados.ID_DOCUMENTO,
      id
    ]);

    await connection.commit();
    
    res.json({ 
      success: true, 
      message: 'Datos actualizados correctamente',
      data: datosActualizados
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error al actualizar usuario:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'Error al actualizar datos del usuario',
      details: error.message
    });
  } finally {
    connection.release();
  }
});
// POST - Agregar a favoritos
app.post("/api/favoritos", async (req, res) => {
  const { ID_NEGOCIO, ID_USUARIOS } = req.body;
  try {
    await database.query("INSERT INTO favoritos (ID_NEGOCIO, ID_USUARIOS) VALUES (?, ?)", [ID_NEGOCIO, ID_USUARIOS]);
    res.sendStatus(201);
  } catch (error) {
    console.error("Error al insertar favorito:", error);
    res.sendStatus(500);
  }
});

// DELETE - Eliminar de favoritos
app.delete("/api/favoritos", async (req, res) => {
  const { ID_NEGOCIO, ID_USUARIOS } = req.body;
  try {
    await database.query("DELETE FROM favoritos WHERE ID_NEGOCIO = ? AND ID_USUARIOS = ?", [ID_NEGOCIO, ID_USUARIOS]);
    res.sendStatus(204);
  } catch (error) {
    console.error("Error al eliminar favorito:", error);
    res.sendStatus(500);
  }
});

// GET - Obtener favoritos por usuario
app.get("/api/favoritos/:idUsuario", async (req, res) => {
  const { idUsuario } = req.params;
  try {
    const [rows] = await database.query(
      `SELECT n.ID_NEGOCIOS, n.NombreNegocio, n.Descripcion, n.Imagen, n.Direccion
       FROM favoritos f
       JOIN negocios n ON f.ID_NEGOCIO = n.ID_NEGOCIOS
       WHERE f.ID_USUARIOS = ?`,
      [idUsuario]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener favoritos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});



app.get("/api/negocio/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await database.query("SELECT * FROM negocios WHERE ID_NEGOCIOS = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "Negocio no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error al obtener negocio:", error);
    res.status(500).json({ mensaje: "Error del servidor" });
  }
});
// POST /api/resenas
app.post("/api/resenas", async (req, res) => {
  const { ID_CALIFICACION, ID_NEGOCIO, Descripcion } = req.body;

  if (!ID_CALIFICACION || !ID_NEGOCIO || !Descripcion) {
    return res.status(400).json({ error: "Campos incompletos" });
  }

  try {
    await database.query(
      `INSERT INTO resenas (ID_CALIFICACION, ID_NEGOCIO, Descripcion)
       VALUES (?, ?, ?)`,
      [ID_CALIFICACION, ID_NEGOCIO, Descripcion]
    );
    res.status(201).json({ mensaje: "Reseña guardada correctamente" });
  } catch (error) {
    console.error("Error al guardar reseña:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});


// ✅ Iniciar el servidor
app.listen(4000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:4000");
});