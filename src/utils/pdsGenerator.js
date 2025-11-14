const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class PDFGenerator {
  generateInvoicePDF(factura, res) {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    const logoPath = path.join(__dirname, "../assets/Logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 50, { width: 80 });
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(25)
      .fillColor("#2c3e50")
      .text(`Factura #${factura[0].ID_FACTURA}`, 200, 50, { align: "right" });
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#2c3e50")
      .text(
        `Fecha: ${new Date(factura[0].FechaPago).toLocaleString()}`,
        200,
        80,
        { align: "right" }
      );

    doc
      .strokeColor("#d4af37")
      .lineWidth(2)
      .moveTo(50, 120)
      .lineTo(550, 120)
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#d4af37")
      .text("Detalles de la Compra", 50, 140);

    let y = 170;
    let total = 0;

    factura.forEach((detalle, index) => {
      const precioUnitario = Math.floor(detalle.PrecioUnitario);
      const subtotal = Math.floor(precioUnitario * detalle.Cantidad);
      total += subtotal;

      doc
        .font("Helvetica")
        .fontSize(12)
        .fillColor("#2c3e50")
        .text(detalle.NombreProducto, 50, y)
        .text(`Cantidad: ${detalle.Cantidad}`, 250, y)
        .text(`$${precioUnitario} c/u`, 350, y)
        .text(`$${new Intl.NumberFormat("es-CO").format(subtotal)}`, 450, y, {
          align: "right",
        });

      y += 25;

      if (index < factura.length - 1) {
        doc
          .strokeColor("#e0e0e0")
          .lineWidth(1)
          .moveTo(50, y - 5)
          .lineTo(550, y - 5)
          .stroke();
      }
    });

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#d4af37")
      .text(
        `Total: $${new Intl.NumberFormat("es-CO").format(total)}`,
        50,
        y + 20,
        { align: "right" }
      );

    doc.end();
  }
}

module.exports = new PDFGenerator();
