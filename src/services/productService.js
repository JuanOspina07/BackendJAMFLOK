const database = require("../utils/database");

class ProductService {
  async getProductsByBusiness(idNegocio) {
    const [rows] = await database.execute(
      `SELECT * FROM Productos WHERE ID_NEGOCIOS = ?`,
      [idNegocio]
    );
    return rows;
  }

  async createProduct(productData) {
    const { ID_NEGOCIOS, Nombre, Descripcion, Precio, Imagen } = productData;

    if (!ID_NEGOCIOS || !Nombre || !Descripcion || !Precio) {
      throw new Error("Todos los campos son obligatorios.");
    }

    const [result] = await database.execute(
      `INSERT INTO Productos (ID_NEGOCIOS, NombreProducto, Descripcion, Precio, Imagen)
       VALUES (?, ?, ?, ?, ?)`,
      [ID_NEGOCIOS, Nombre, Descripcion, Precio, Imagen]
    );

    return { message: "Producto creado exitosamente", id: result.insertId };
  }
  async updateProductStatus(idProducto, estado) {
    if (estado !== 0 && estado !== 1) {
      throw new Error("El estado debe ser 0 o 1");
    }

    const [result] = await database.query(
      `UPDATE productos SET Estado = ? WHERE ID_PRODUCTOS = ?`,
      [estado, idProducto]
    );

    if (result.affectedRows === 0) {
      throw new Error("Producto no encontrado");
    }

    return { success: true, estado };
  }
}

module.exports = new ProductService();
