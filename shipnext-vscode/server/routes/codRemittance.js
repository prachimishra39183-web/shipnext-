
const express = require('express');
const prisma = require('../prisma');
const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

const router = express.Router();

// CUSTOMER: View own COD remittance records
router.get(
  '/customer',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const shipments = await prisma.shipment.findMany({
        where: {
          customerId: req.user.userId,
          recipientPaymentMode: 'COD',
        },
        orderBy: { createdAt: 'desc' },
      });

      const totalCOD = shipments.reduce(
        (sum, s) => sum + Number(s.codAmount || 0), 0
      );

      const totalCharges = shipments.reduce(
        (sum, s) => sum + Number(s.codCharge || 0), 0
      );

      const remitted = shipments
        .filter(s => s.codRemittanceStatus === 'REMITTED')
        .reduce((sum, s) => sum + Number(s.codNetAmount || 0), 0);

      const pending = shipments
        .filter(s => s.codRemittanceStatus !== 'REMITTED')
        .reduce((sum, s) => sum + Number(s.codNetAmount || 0), 0);

      res.json({
        success: true,
        summary: {
          totalCOD,
          totalCharges,
          remitted,
          pending,
        },
        shipments,
      });
    } catch (error) {
      console.error('Customer COD remittance error:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to load COD remittance records.',
      });
    }
  }
);

// ADMIN: View all COD remittance records
router.get(
  '/admin',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const shipments = await prisma.shipment.findMany({
        where: { recipientPaymentMode: 'COD' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const totalCOD = shipments.reduce(
        (sum, s) => sum + Number(s.codAmount || 0), 0
      );

      const totalCharges = shipments.reduce(
        (sum, s) => sum + Number(s.codCharge || 0), 0
      );

      const remitted = shipments
        .filter(s => s.codRemittanceStatus === 'REMITTED')
        .reduce((sum, s) => sum + Number(s.codNetAmount || 0), 0);

      const pending = shipments
        .filter(s => s.codRemittanceStatus !== 'REMITTED')
        .reduce((sum, s) => sum + Number(s.codNetAmount || 0), 0);

      res.json({
        success: true,
        summary: {
          totalCOD,
          totalCharges,
          remitted,
          pending,
        },
        shipments,
      });
    } catch (error) {
      console.error('Admin COD remittance error:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to load COD remittance records.',
      });
    }
  }
);

// ADMIN: Mark courier COD remittance as received
router.patch(
  '/:shipmentId/remit',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const reference = String(req.body.reference || '').trim();

      const shipment = await prisma.shipment.findUnique({
        where: { id: req.params.shipmentId },
      });

      if (!shipment || shipment.recipientPaymentMode !== 'COD') {
        return res.status(404).json({
          success: false,
          message: 'COD shipment not found.',
        });
      }

      if (shipment.codRemittanceStatus === 'REMITTED') {
        return res.status(409).json({
          success: false,
          message: 'COD remittance is already marked as received.',
        });
      }

      const updated = await prisma.shipment.update({
        where: { id: shipment.id },
        data: {
          codRemittanceStatus: 'REMITTED',
          codRemittedAt: new Date(),
          codRemittanceReference: reference || null,
        },
      });

      res.json({
        success: true,
        message: 'Courier remittance marked as received.',
        shipment: updated,
      });
    } catch (error) {
      console.error('COD remit update error:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to update COD remittance.',
      });
    }
  }
);

// ADMIN: Mark customer settlement as completed
router.patch(
  '/:shipmentId/settle',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const reference = String(req.body.reference || '').trim();

      const shipment = await prisma.shipment.findUnique({
        where: { id: req.params.shipmentId },
      });

      if (!shipment || shipment.recipientPaymentMode !== 'COD') {
        return res.status(404).json({
          success: false,
          message: 'COD shipment not found.',
        });
      }

      if (shipment.codRemittanceStatus !== 'REMITTED') {
        return res.status(409).json({
          success: false,
          message: 'Courier remittance must be received before customer settlement.',
        });
      }

      if (shipment.codSettlementStatus === 'SETTLED') {
        return res.status(409).json({
          success: false,
          message: 'Customer settlement is already completed.',
        });
      }

      const updated = await prisma.shipment.update({
        where: { id: shipment.id },
        data: {
          codSettlementStatus: 'SETTLED',
          codSettledAt: new Date(),
          codSettlementReference: reference || null,
        },
      });

      res.json({
        success: true,
        message: 'Customer settlement marked as completed.',
        shipment: updated,
      });
    } catch (error) {
      console.error('COD settlement update error:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to update customer settlement.',
      });
    }
  }
);

module.exports = router;
