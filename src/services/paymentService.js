const database = require("../utils/database");

class PaymentService {
  async processPayment(paymentData, idUsuario) {
    const { productos, metodoPago } = paymentData;

    if (
      !productos ||
      !Array.isArray(productos) ||
      productos.length === 0 ||
      !metodoPago
    ) {
      throw new Error("Datos de pago incompletos o inválidos");
    }

    // Validar productos
    for (const producto of productos) {
      if (
        !producto.idProducto ||
        !Number.isInteger(producto.cantidad) ||
        producto.cantidad <= 0 ||
        !producto.precioUnitario ||
        producto.precioUnitario <= 0
      ) {
        throw new Error(
          "Datos de producto inválidos: cantidad y precio deben ser positivos"
        );
      }
    }

    const connection = await database.getConnection();

    try {
      await connection.beginTransaction();

      // Validar usuario
      const [userCheck] = await connection.query(
        "SELECT ID_USUARIOS FROM Usuarios WHERE ID_USUARIOS = ?",
        [idUsuario]
      );
      if (userCheck.length === 0) {
        throw new Error("El usuario no existe");
      }

      // Validar productos
      for (const producto of productos) {
        const [productCheck] = await connection.query(
          "SELECT ID_PRODUCTOS FROM Productos WHERE ID_PRODUCTOS = ?",
          [producto.idProducto]
        );
        if (productCheck.length === 0) {
          throw new Error(
            `El producto con ID ${producto.idProducto} no existe`
          );
        }
      }

      // Crear pago
      const [pagoResult] = await connection.query(
        "INSERT INTO Pago (MetodoPago) VALUES (?)",
        [metodoPago]
      );
      const idPago = pagoResult.insertId;

      // Crear factura
      const [facturaResult] = await connection.query(
        "INSERT INTO Factura (ID_USUARIOS, ID_PAGO, FechaPago) VALUES (?, ?, NOW())",
        [idUsuario, idPago]
      );
      const idFactura = facturaResult.insertId;

      // Crear detalles de factura
      for (const producto of productos) {
        await connection.query(
          "INSERT INTO FacturaDetalle (ID_FACTURA, ID_PRODUCTOS, Monto, Cantidad) VALUES (?, ?, ?, ?)",
          [
            idFactura,
            producto.idProducto,
            producto.precioUnitario,
            producto.cantidad,
          ]
        );
      }

      await connection.commit();
      return {
        success: true,
        idFactura,
        message: "Pago procesado correctamente",
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getInvoiceById(id) {
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
      throw new Error("Factura no encontrada");
    }

    return factura;
  }
}

module.exports = new PaymentService();
