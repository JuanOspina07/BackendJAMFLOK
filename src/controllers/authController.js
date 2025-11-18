const authService = require('../services/authService');

class AuthController {
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      res.json(result);
    } catch (error) {
      console.error(" Error en el registro:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error en el registro",
      });
    }
  }

  async login(req, res) {
    try {
      const { nombreUsuario, contraseña } = req.body;
      const result = await authService.login(nombreUsuario, contraseña);
      res.json(result);
    } catch (error) {
      console.error("Error en el login:", error);
      res.status(401).json({ 
        success: false, 
        message: error.message || "Error en el servidor" 
      });
    }
  }

  async requestPasswordReset(req, res) {
    try {
      const { correo } = req.body;
      const result = await authService.requestPasswordReset(correo);
      res.json(result);
    } catch (error) {
      console.error("Error al enviar correo de recuperación:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, nuevaContrasena } = req.body;
      const result = await authService.resetPassword(token, nuevaContrasena);
      res.json(result);
    } catch (error) {
      console.error("Error al restablecer la contraseña:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async validateToken(req, res) {
    try {
      const { token } = req.params;
      const result = await authService.validateToken(token);
      res.json(result);
    } catch (error) {
      console.error("Error al verificar el token:", error);
      res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
}

module.exports = new AuthController();