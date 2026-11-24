
const express = require('express');
const prisma = require('../prisma');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Get customer tax settings
router.get(
  '/',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const settings = await prisma.customerTaxSettings.findUnique({
        where: { userId: req.user.userId },
      });

      res.json({
        success: true,
        settings: settings || {
          defaultGstRate: 18,
          taxInclusive: false,
          reverseCharge: false,
          placeOfSupply: '',
          enableGstInvoice: true,
        },
      });
    } catch (error) {
      console.error('Tax settings fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to load tax settings.',
      });
    }
  }
);

// Save customer tax settings
router.put(
  '/',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const {
        defaultGstRate,
        taxInclusive,
        reverseCharge,
        placeOfSupply,
        enableGstInvoice,
      } = req.body;

      const rate = Number(defaultGstRate);

      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        return res.status(400).json({
          success: false,
          message: 'GST rate must be between 0 and 100.',
        });
      }

      const settings = await prisma.customerTaxSettings.upsert({
        where: { userId: req.user.userId },
        update: {
          defaultGstRate: rate,
          taxInclusive: Boolean(taxInclusive),
          reverseCharge: Boolean(reverseCharge),
          placeOfSupply: placeOfSupply || null,
          enableGstInvoice: Boolean(enableGstInvoice),
        },
        create: {
          userId: req.user.userId,
          defaultGstRate: rate,
          taxInclusive: Boolean(taxInclusive),
          reverseCharge: Boolean(reverseCharge),
          placeOfSupply: placeOfSupply || null,
          enableGstInvoice: enableGstInvoice !== false,
        },
      });

      res.json({
        success: true,
        message: 'Tax settings saved successfully.',
        settings,
      });
    } catch (error) {
      console.error('Tax settings save error:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to save tax settings.',
      });
    }
  }
);

module.exports = router;
