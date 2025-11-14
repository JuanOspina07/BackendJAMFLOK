const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { verifyToken } = require("../middlewares/auth");

router.post("/pagos", verifyToken, paymentController.processPayment);
router.get("/facturas/:id", paymentController.getInvoice);
router.get("/facturas/:id/descargar", paymentController.downloadInvoice);

module.exports = router;
