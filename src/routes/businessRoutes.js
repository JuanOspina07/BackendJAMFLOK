const express = require("express");
const router = express.Router();
const businessController = require("../controllers/businessController");

router.get("/negocios/:idUsuario", businessController.getBusinessesByUser);
router.get("/negocios", businessController.getAllBusinesses);
router.get("/negocio/:id", businessController.getBusiness);
router.get("/negocios/detalle/:id", businessController.getBusinessDetails);
router.post("/negociosnuevo", businessController.createBusiness);
router.get("/categorias", businessController.getCategories);

module.exports = router;
