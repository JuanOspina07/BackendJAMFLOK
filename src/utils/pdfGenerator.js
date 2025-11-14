const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

class PDFGenerator {
  generateInvoicePDF(factura, res) {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Intentar cargar el logo si existe
    try {
      const logoPath = path.join(__dirname, "../assets/Logo.png");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 50, { width: 80 });
      }
    } catch (error) {
      console.log("Logo no encontrado, continuando sin él...");
    }

    // Encabezado de la factura
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

    // Línea decorativa
    doc
      .strokeColor("#d4af37")
      .lineWidth(2)
      .moveTo(50, 120)
      .lineTo(550, 120)
      .stroke();

    // Título de detalles
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#d4af37")
      .text("Detalles de la Compra", 50, 140);

    // Detalles de productos
    let y = 170;
    let total = 0;

    factura.forEach((detalle, index) => {
      const precioUnitario = parseFloat(detalle.PrecioUnitario) || 0;
      const cantidad = parseInt(detalle.Cantidad) || 0;
      const subtotal = precioUnitario * cantidad;
      total += subtotal;

      doc
        .font("Helvetica")
        .fontSize(12)
        .fillColor("#2c3e50")
        .text(detalle.NombreProducto || "Producto sin nombre", 50, y)
        .text(`Cantidad: ${cantidad}`, 250, y)
        .text(`$${precioUnitario.toFixed(2)} c/u`, 350, y)
        .text(`$${subtotal.toFixed(2)}`, 450, y, { align: "right" });

      y += 25;

      // Línea separadora entre productos
      if (index < factura.length - 1) {
        doc
          .strokeColor("#e0e0e0")
          .lineWidth(1)
          .moveTo(50, y - 5)
          .lineTo(550, y - 5)
          .stroke();
      }
    });

    // Total
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#d4af37")
      .text(`Total: $${total.toFixed(2)}`, 400, y + 20, {
        width: 150,
        align: "right",
      });

    doc.end();
  }
}

module.exports = new PDFGenerator();
