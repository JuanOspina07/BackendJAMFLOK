const nodemailer = require("nodemailer");
const { EMAIL_USER, EMAIL_PASS } = require("../config/env");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

class EmailService {
  async sendPasswordResetEmail(correo, token) {
    const link = `http://localhost:5173/restablecer/${token}`;

    await transporter.sendMail({
      from: '"Soporte Jamflok" <soportesavora@gmail.com>',
      to: correo,
      subject: "🔒 Recuperación de contraseña - Jamflok",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; background: linear-gradient(135deg, #fefefe, #f5f5f5); padding: 40px;">
          <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); overflow: hidden;">
            <div style="background-color: #d4af37; padding: 20px; text-align: center;">
              <img src="https://i.ibb.co/7tGvFHxH/q.png" alt="Savora Logo" style="height: 60px;" />
            </div>
    
            <div style="padding: 30px; text-align: center;">
              <h2 style="color: #2c3e50;">¿Olvidaste tu contraseña?</h2>
              <p style="color: #555; font-size: 16px; margin: 20px 0;">
                Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para continuar.
              </p>
    
              <a href="${link}" style="display: inline-block; padding: 14px 28px; background-color: #d4af37; color: #fff; text-decoration: none; font-size: 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); margin-top: 10px;">
                Restablecer Contraseña
              </a>
    
              <p style="font-size: 14px; color: #888; margin-top: 30px;">
                Este enlace estará activo por 1 hora. Si tú no solicitaste este cambio, puedes ignorar este mensaje con seguridad.
              </p>
            </div>
    
            <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="font-size: 13px; color: #bbb;">¿Necesitas ayuda? Escríbenos a <a href="mailto:soportesavora@gmail.com" style="color: #d4af37;">soporte@savora.com</a></p>
              <p style="font-size: 12px; color: #ccc;">Savora © ${new Date().getFullYear()} - Todos los derechos reservados</p>
            </div>
          </div>
        </div>
      `
    });
  }
}

module.exports = new EmailService();