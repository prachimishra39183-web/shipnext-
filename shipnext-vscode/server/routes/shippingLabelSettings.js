
const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.use(authenticateToken, authorizeRole('CUSTOMER'));

const defaults = {
  labelSize: '4X6',
  orientation: 'PORTRAIT',
  showLogo: true,
  showCompanyName: true,
  showSenderPhone: true,
  showReceiverPhone: true,
  showOrderId: true,
  showPaymentMode: true,
  barcodeFormat: 'CODE128',
};

// GET label settings
router.get('/me', async (req, res) => {
  try {
    let settings = await prisma.shippingLabelSettings.findUnique({
      where: { userId: req.user.userId },
    });

    if (!settings) {
      settings = await prisma.shippingLabelSettings.create({
        data: {
          userId: req.user.userId,
          ...defaults,
        },
      });
    }

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Label settings fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load label settings',
    });
  }
});

// SAVE label settings
router.put('/me', async (req, res) => {
  try {
    const {
      labelSize,
      orientation,
      showLogo,
      showCompanyName,
      showSenderPhone,
      showReceiverPhone,
      showOrderId,
      showPaymentMode,
      barcodeFormat,
    } = req.body;

    const allowedSizes = ['4X6', '4X4', 'A4'];
    const allowedOrientations = ['PORTRAIT', 'LANDSCAPE'];
    const allowedBarcodes = ['CODE128', 'QR'];

    if (labelSize && !allowedSizes.includes(labelSize)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid label size',
      });
    }

    if (orientation && !allowedOrientations.includes(orientation)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid label orientation',
      });
    }

    if (barcodeFormat && !allowedBarcodes.includes(barcodeFormat)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid barcode format',
      });
    }

    const settings = await prisma.shippingLabelSettings.upsert({
      where: { userId: req.user.userId },
      create: {
        userId: req.user.userId,
        ...defaults,
        ...req.body,
      },
      update: {
        labelSize,
        orientation,
        showLogo,
        showCompanyName,
        showSenderPhone,
        showReceiverPhone,
        showOrderId,
        showPaymentMode,
        barcodeFormat,
      },
    });

    res.json({
      success: true,
      message: 'Shipping label settings saved',
      settings,
    });
  } catch (error) {
    console.error('Label settings save error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save label settings',
    });
  }
});

module.exports = router;
