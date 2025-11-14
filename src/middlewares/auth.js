const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error al verificar token:", error);
    res.status(401).json({ success: false, message: "Token inválido" });
  }
};

module.exports = { verifyToken };
