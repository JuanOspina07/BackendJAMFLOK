const paymentService = require("../services/paymentService");
const pdfGenerator = require("../utils/pdfGenerator");

class PaymentController {
  async processPayment(req, res) {
    try {
      const result = await paymentService.processPayment(
        req.body,
        req.user.idUsuario
      );
      res.json(result);
    } catch (error) {
      console.error("Error en la transacción de pago:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error al procesar el pago",
      });
    }
  }

  async getInvoice(req, res) {
    try {
      const { id } = req.params;
      const factura = await paymentService.getInvoiceById(id);
      res.json(factura);
    } catch (error) {
      console.error("Error al obtener la factura:", error);
      res.status(404).json({ success: false, message: error.message });
    }
  }

  async downloadInvoice(req, res) {
    try {
      const { id } = req.params;
      const factura = await paymentService.getInvoiceById(id);

      // Configurar headers para descarga
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=factura-${id}.pdf`
      );

      // Generar PDF
      await pdfGenerator.generateInvoicePDF(factura, res);
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new PaymentController();
