const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/usuario/:id", userController.getUser);
router.put("/usuario/:id", userController.updateUser);

module.exports = router;
