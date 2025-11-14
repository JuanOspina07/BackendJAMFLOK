const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

router.get(
  "/productos/negocio/:idNegocio",
  productController.getProductsByBusiness
);
router.post("/productosnuevo", productController.createProduct);

module.exports = router;
