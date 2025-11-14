const businessService = require("../services/businessService");

class BusinessController {
  async getBusinessesByUser(req, res) {
    try {
      const { idUsuario } = req.params;
      const negocios = await businessService.getBusinessesByUser(idUsuario);
      res.json(negocios);
    } catch (error) {
      console.error("❌ Error al obtener los negocios:", error);
      res.status(404).json({ error: error.message });
    }
  }

  async getAllBusinesses(req, res) {
    try {
      const negocios = await businessService.getAllBusinesses();
      res.json(negocios);
    } catch (error) {
      console.error("❌ Error al obtener negocios:", error);
      res.status(500).json({ error: "Error al obtener negocios" });
    }
  }

  async getBusiness(req, res) {
    try {
      const { id } = req.params;
      const negocio = await businessService.getBusinessById(id);
      res.json(negocio);
    } catch (error) {
      console.error("Error al obtener negocio:", error);
      res.status(404).json({ mensaje: error.message });
    }
  }

  async getBusinessDetails(req, res) {
    try {
      const { id } = req.params;
      const negocio = await businessService.getBusinessDetails(id);
      res.json(negocio);
    } catch (error) {
      console.error("❌ Error al obtener negocio por ID:", error);
      res.status(404).json({ message: error.message });
    }
  }

  async createBusiness(req, res) {
    try {
      const result = await businessService.createBusiness(req.body);
      res.json(result);
    } catch (error) {
      console.error("❌ Error al guardar negocio:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getCategories(req, res) {
    try {
      const categorias = await businessService.getCategories();
      res.json(categorias);
    } catch (error) {
      console.error("Error al obtener categorías:", error);
      res.status(500).json({ message: "Error interno al obtener categorías" });
    }
  }
}

module.exports = new BusinessController();
