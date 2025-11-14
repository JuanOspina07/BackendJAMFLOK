const express = require("express");
const router = express.Router();
const favoriteController = require("../controllers/favoriteController");

router.post("/favoritos", favoriteController.addFavorite);
router.delete("/favoritos", favoriteController.removeFavorite);
router.get("/favoritos/:idUsuario", favoriteController.getFavorites);

module.exports = router;
