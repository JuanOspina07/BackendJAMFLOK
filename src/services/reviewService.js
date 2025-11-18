const database = require("../utils/database");

class ReviewService {
  async getReviewsByBusiness(idNegocio) {
    const [rows] = await database.query(
      `
      SELECT 
        r.ID_RESENA,
        r.ID_CALIFICACION,
        r.Descripcion,
        r.FechaCreacion AS Fecha,
        c.NumEstrellas,
        u.ID_USUARIOS AS ID_USUARIO,
        u.NombreUsuario
      FROM resenas r
      JOIN calificacion c ON r.ID_CALIFICACION = c.ID_CALIFICACION
      JOIN usuarios u ON r.ID_USUARIO = u.ID_USUARIOS
      WHERE r.ID_NEGOCIO = ?
      `,
      [idNegocio]
    );

    return rows;
  }



  async createReview(reviewData) {
    const { ID_CALIFICACION, ID_NEGOCIO, ID_USUARIO, Descripcion } = reviewData;

    if (!ID_CALIFICACION || !ID_NEGOCIO || !ID_USUARIO || !Descripcion) {
      throw new Error("Campos incompletos");
    }

    await database.query(
      `INSERT INTO resenas (ID_CALIFICACION, ID_NEGOCIO, ID_USUARIO, Descripcion)
      VALUES (?, ?, ?, ?)`,
      [ID_CALIFICACION, ID_NEGOCIO, ID_USUARIO, Descripcion]
    );

    return { mensaje: "Reseña guardada correctamente" };
  }
}

module.exports = new ReviewService();
