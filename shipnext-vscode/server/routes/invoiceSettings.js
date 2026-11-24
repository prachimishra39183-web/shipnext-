
const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.use(authenticateToken, authorizeRole('CUSTOMER'));

const defaultSettings = {
  invoiceTitle: 'TAX INVOICE',
  templateStyle: 'STANDARD',
  showLogo: true,
  showGst: true,
  showPan: false,
  footerNote: '',
  termsAndConditions: '',
};

// GET customer invoice settings
router.get('/me', async (req, res) => {
  try {
    let settings = await prisma.customerInvoiceSettings.findUnique({
      where: { userId: req.user.userId },
    });

    if (!settings) {
      settings = await prisma.customerInvoiceSettings.create({
        data: {
          userId: req.user.userId,
          ...defaultSettings,
        },
      });
    }

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Invoice settings fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load invoice settings',
    });
  }
});

// SAVE customer invoice settings
router.put('/me', async (req, res) => {
  try {
    const {
      invoiceTitle,
      templateStyle,
      showLogo,
      showGst,
      showPan,
      footerNote,
      termsAndConditions,
    } = req.body;

    const allowedStyles = ['STANDARD', 'MODERN', 'MINIMAL'];

    if (templateStyle && !allowedStyles.includes(templateStyle)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice template style',
      });
    }

    const settings = await prisma.customerInvoiceSettings.upsert({
      where: { userId: req.user.userId },
      create: {
        userId: req.user.userId,
        invoiceTitle: invoiceTitle ?? defaultSettings.invoiceTitle,
        templateStyle: templateStyle ?? defaultSettings.templateStyle,
        showLogo: showLogo ?? defaultSettings.showLogo,
        showGst: showGst ?? defaultSettings.showGst,
        showPan: showPan ?? defaultSettings.showPan,
        footerNote: footerNote ?? '',
        termsAndConditions: termsAndConditions ?? '',
      },
      update: {
        invoiceTitle,
        templateStyle,
        showLogo,
        showGst,
        showPan,
        footerNote,
        termsAndConditions,
      },
    });

    res.json({
      success: true,
      message: 'Invoice settings saved successfully',
      settings,
    });
  } catch (error) {
    console.error('Invoice settings save error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save invoice settings',
    });
  }
});

module.exports = router;
