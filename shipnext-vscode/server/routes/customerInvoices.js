
const express = require('express');
const PDFDocument = require('pdfkit');
const prisma = require('../prisma');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// GET: List invoices belonging to the logged-in customer.
router.get(
  '/',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const invoices = await prisma.shipmentInvoice.findMany({
        where: {
          customerId: req.user.userId,
        },
        orderBy: {
          invoiceDate: 'desc',
        },
        select: {
          id: true,
          invoiceNumber: true,
          docketNumber: true,
          invoiceDate: true,
          taxableAmount: true,
          totalTax: true,
          totalAmount: true,
          paymentStatus: true,
        },
      });

      return res.json({
        success: true,
        invoices,
      });
    } catch (error) {
      console.error('Customer invoice list error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to load invoices.',
      });
    }
  }
);

// GET: Download one invoice as a PDF.
router.get(
  '/:invoiceId/pdf',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const invoice = await prisma.shipmentInvoice.findFirst({
        where: {
          id: req.params.invoiceId,
          customerId: req.user.userId,
        },
        include: {
          shipment: true,
        },
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found.',
        });
      }

      const doc = new PDFDocument({
        size: 'A4',
        margin: 45,
        bufferPages: true,
      });

      const safeInvoiceNumber = invoice.invoiceNumber.replace(
        /[^a-zA-Z0-9-]/g,
        '_'
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeInvoiceNumber}.pdf"`
      );

      doc.pipe(res);

      const orange = '#FF3B1F';
      const dark = '#172033';
      const grey = '#64748B';

      const money = (value) =>
        `Rs. ${Number(value || 0).toFixed(2)}`;

      // Header
      doc.fillColor(dark)
        .fontSize(25)
        .font('Helvetica-Bold')
        .text('SHIPNEXT');

      doc.fillColor(orange)
        .fontSize(10)
        .text('SHIPPING & LOGISTICS');

      doc.moveDown(1);

      doc.fillColor(dark)
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('TAX INVOICE', { align: 'right' });

      doc.fillColor(grey)
        .fontSize(9)
        .font('Helvetica')
        .text(`Invoice No: ${invoice.invoiceNumber}`, {
          align: 'right',
        })
        .text(
          `Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`,
          { align: 'right' }
        );

      doc.moveDown(1);

      doc.strokeColor(orange)
        .lineWidth(2)
        .moveTo(45, doc.y)
        .lineTo(550, doc.y)
        .stroke();

      doc.moveDown(1);

      // Supplier details
      doc.fillColor(dark)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Supplier Details');

      doc.fontSize(10)
        .font('Helvetica')
        .text('SHIPNEXT')
        .text('Legal Name: RAJESH PANKAJBHAI SWAIN')
        .text('GSTIN: 24GHHPS8591C1ZW')
        .text('Surat, Gujarat - 394221');

      doc.moveDown(1);

      // Customer details
      doc.fillColor(dark)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Bill To');

      doc.fontSize(10)
        .font('Helvetica')
        .text(invoice.billingName || 'Customer')
        .text(`GSTIN: ${invoice.billingGst || 'Not provided'}`)
        .text(invoice.billingAddress || '')
        .text(
          `${invoice.billingState || ''} ${invoice.billingPincode || ''}`
        );

      doc.moveDown(1);

      // Shipment details
      doc.fillColor(dark)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Shipment Details');

      doc.fontSize(10)
        .font('Helvetica')
        .text(`Docket Number: ${invoice.docketNumber}`)
        .text(`Tracking ID: ${invoice.shipment.trackingId}`)
        .text(
          `Pickup PIN: ${invoice.shipment.pickupPincode}`
        )
        .text(
          `Delivery PIN: ${invoice.shipment.deliveryPincode}`
        )
        .text(
          `Weight: ${(invoice.shipment.weightGrams / 1000).toFixed(2)} kg`
        )
        .text(
          `Shipping Mode: ${invoice.shipment.shippingMode || '-'}`
        );

      doc.moveDown(1.5);

      // Invoice amount table
      const tableTop = doc.y;
      const left = 45;
      const right = 550;

      doc.rect(left, tableTop, right - left, 25)
        .fill(dark);

      doc.fillColor('#FFFFFF')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Description', left + 10, tableTop + 8)
        .text('Amount', 440, tableTop + 8, {
          width: 100,
          align: 'right',
        });

      let y = tableTop + 35;

      const addRow = (label, value, bold = false) => {
        doc.fillColor(dark)
          .font(bold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(10)
          .text(label, left + 10, y)
          .text(money(value), 440, y, {
            width: 100,
            align: 'right',
          });

        y += 23;
      };

      addRow('Shipping Charges', invoice.shippingCharge);
      addRow('COD Charges', invoice.codCharge);
      addRow('Taxable Amount', invoice.taxableAmount);

      if (Number(invoice.cgstAmount) > 0) {
        addRow('CGST', invoice.cgstAmount);
      }

      if (Number(invoice.sgstAmount) > 0) {
        addRow('SGST', invoice.sgstAmount);
      }

      if (Number(invoice.igstAmount) > 0) {
        addRow('IGST', invoice.igstAmount);
      }

      doc.moveTo(left, y)
        .lineTo(right, y)
        .strokeColor('#CBD5E1')
        .stroke();

      y += 12;

      addRow('Total Tax', invoice.totalTax, true);
      addRow('Invoice Total', invoice.totalAmount, true);

      y += 8;

      doc.fillColor(orange)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(
          `Payment Status: ${invoice.paymentStatus}`,
          left + 10,
          y
        );

      doc.moveDown(3);

      doc.fillColor(grey)
        .fontSize(9)
        .font('Helvetica')
        .text(
          'This is a computer-generated invoice issued by ShipNext.',
          { align: 'center' }
        );

      doc.text('Thank you for shipping with ShipNext!', {
        align: 'center',
      });

      doc.end();
    } catch (error) {
      console.error('Invoice PDF error:', error);

      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: 'Unable to generate invoice PDF.',
        });
      }

      res.end();
    }
  }
);

module.exports = router;
