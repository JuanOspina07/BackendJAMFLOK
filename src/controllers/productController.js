const productService = require("../services/productService");

class ProductController {
  async getProductsByBusiness(req, res) {
    try {
      const { idNegocio } = req.params;
      const productos = await productService.getProductsByBusiness(idNegocio);
      res.json(productos);
    } catch (error) {
      console.error("❌ Error al obtener productos:", error);
      res.status(500).json({ message: "Error interno al obtener productos" });
    }
  }

  async createProduct(req, res) {
    try {
      const result = await productService.createProduct(req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error("❌ Error al insertar producto:", error);
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new ProductController();
