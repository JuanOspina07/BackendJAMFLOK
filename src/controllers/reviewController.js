const reviewService = require("../services/reviewService");

class ReviewController {
  async getReviewsByBusiness(req, res) {
    try {
      const { id } = req.params;
      const reseñas = await reviewService.getReviewsByBusiness(id);
      res.json(reseñas);
    } catch (error) {
      console.error("❌ Error al obtener reseñas:", error);
      res.status(500).json({ error: "Error al obtener reseñas" });
    }
  }

  async createReview(req, res) {
    try {
      const result = await reviewService.createReview(req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error al guardar reseña:", error);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new ReviewController();
