const database = require("../utils/database");

class ReviewService {
  async getReviewsByBusiness(idNegocio) {
    const [rows] = await database.query(
      `
      SELECT r.ID_RESENA, r.ID_CALIFICACION, r.Descripcion, c.NumEstrellas 
      FROM Resenas r 
      JOIN Calificacion c ON r.ID_CALIFICACION = c.ID_CALIFICACION 
      WHERE r.ID_NEGOCIO = ?
    `,
      [idNegocio]
    );

    return rows;
  }

  async createReview(reviewData) {
    const { ID_CALIFICACION, ID_NEGOCIO, Descripcion } = reviewData;

    if (!ID_CALIFICACION || !ID_NEGOCIO || !Descripcion) {
      throw new Error("Campos incompletos");
    }

    await database.query(
      `INSERT INTO resenas (ID_CALIFICACION, ID_NEGOCIO, Descripcion)
       VALUES (?, ?, ?)`,
      [ID_CALIFICACION, ID_NEGOCIO, Descripcion]
    );

    return { mensaje: "Reseña guardada correctamente" };
  }
}

module.exports = new ReviewService();
