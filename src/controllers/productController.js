const productService = require("../services/productService");

class ProductController {
  async getProductsByBusiness(req, res) {
    try {
      const { idNegocio } = req.params;
      const productos = await productService.getProductsByBusiness(idNegocio);
      res.json(productos);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      res.status(500).json({ message: "Error interno al obtener productos" });
    }
  }

  async createProduct(req, res) {
    try {
      const result = await productService.createProduct(req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error al insertar producto:", error);
      res.status(400).json({ message: error.message });
    }
  }
  async updatProductStatus(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      const result = await productService.updateProductStatus(Number(id), estado);
  
      res.json({
        message: "Estado actualizado correctamente",
        nuevoEstado: result.estado
      });
  
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new ProductController();
