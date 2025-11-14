const database = require("../utils/database");

class FavoriteService {
  async addFavorite(ID_NEGOCIO, ID_USUARIOS) {
    await database.query(
      "INSERT INTO favoritos (ID_NEGOCIO, ID_USUARIOS) VALUES (?, ?)",
      [ID_NEGOCIO, ID_USUARIOS]
    );
    return { message: "Favorito agregado correctamente" };
  }

  async removeFavorite(ID_NEGOCIO, ID_USUARIOS) {
    await database.query(
      "DELETE FROM favoritos WHERE ID_NEGOCIO = ? AND ID_USUARIOS = ?",
      [ID_NEGOCIO, ID_USUARIOS]
    );
    return { message: "Favorito eliminado correctamente" };
  }

  async getFavoritesByUser(idUsuario) {
    const [rows] = await database.query(
      `SELECT n.ID_NEGOCIOS, n.NombreNegocio, n.Descripcion, n.Imagen, n.Direccion
       FROM favoritos f
       JOIN negocios n ON f.ID_NEGOCIO = n.ID_NEGOCIOS
       WHERE f.ID_USUARIOS = ?`,
      [idUsuario]
    );
    return rows;
  }
}

module.exports = new FavoriteService();
