const userService = require("../services/userService");

class UserController {
  async getUser(req, res) {
    try {
      const { id } = req.params;
      const usuario = await userService.getUserById(id);
      res.json(usuario);
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
      res.status(404).json({ error: error.message });
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const datosActualizados = req.body;

      // Validación de fecha
      if (
        datosActualizados.FechaNacimiento &&
        !/^\d{4}-\d{2}-\d{2}$/.test(datosActualizados.FechaNacimiento)
      ) {
        return res
          .status(400)
          .json({ error: "Formato de fecha inválido. Use YYYY-MM-DD" });
      }

      const result = await userService.updateUser(id, datosActualizados);
      res.json(result);
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      res.status(500).json({
        success: false,
        error: "Error al actualizar datos del usuario",
        details: error.message,
      });
    }
  }
}

module.exports = new UserController();
