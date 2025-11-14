const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { PORT } = require("./config/env");

// Importar rutas
const authRoutes = require("./routes/authRoutes");
const locationRoutes = require("./routes/locationRoutes");
const userRoutes = require("./routes/userRoutes");
const businessRoutes = require("./routes/businessRoutes");
const productRoutes = require("./routes/productRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");

const app = express();

// Middlewares
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("dev"));
app.use(express.json());

// Rutas
app.use("/api", authRoutes);
app.use("/api", locationRoutes);
app.use("/api", userRoutes);
app.use("/api", businessRoutes);
app.use("/api", productRoutes);
app.use("/api", reviewRoutes);
app.use("/api", paymentRoutes);
app.use("/api", favoriteRoutes);

// Ruta de salud
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Servidor funcionando correctamente" });
});

module.exports = app;
