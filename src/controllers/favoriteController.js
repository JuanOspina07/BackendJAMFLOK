const favoriteService = require("../services/favoriteService");

class FavoriteController {
  async addFavorite(req, res) {
    try {
      const { ID_NEGOCIO, ID_USUARIOS } = req.body;
      await favoriteService.addFavorite(ID_NEGOCIO, ID_USUARIOS);
      res.sendStatus(201);
    } catch (error) {
      console.error("Error al insertar favorito:", error);
      res.sendStatus(500);
    }
  }

  async removeFavorite(req, res) {
    try {
      const { ID_NEGOCIO, ID_USUARIOS } = req.body;
      await favoriteService.removeFavorite(ID_NEGOCIO, ID_USUARIOS);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error al eliminar favorito:", error);
      res.sendStatus(500);
    }
  }

  async getFavorites(req, res) {
    try {
      const { idUsuario } = req.params;
      const favoritos = await favoriteService.getFavoritesByUser(idUsuario);
      res.json(favoritos);
    } catch (error) {
      console.error("Error al obtener favoritos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
}

module.exports = new FavoriteController();
