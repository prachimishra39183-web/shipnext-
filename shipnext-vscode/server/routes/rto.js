
const express = require('express');
const prisma = require('../prisma');
const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

const router = express.Router();

const VALID_STATUSES = [
  'INITIATED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED_TO_SELLER',
  'CANCELLED',
];

// CUSTOMER: VIEW OWN RTO RECORDS
router.get(
  '/my',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const records = await prisma.rTORecord.findMany({
        where: {
          shipment: {
            customerId: req.user.userId,
          },
        },
        include: {
          shipment: true,
        },
        orderBy: {
          initiatedAt: 'desc',
        },
      });

      res.json({
        success: true,
        total: records.length,
        records,
      });
    } catch (error) {
      console.error('Customer RTO error:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to fetch RTO records.',
      });
    }
  }
);

// ADMIN: VIEW ALL RTO RECORDS
router.get(
  '/admin',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const records = await prisma.rTORecord.findMany({
        include: {
          shipment: {
            include: {
              customer: true,
            },
          },
        },
        orderBy: {
          initiatedAt: 'desc',
        },
      });

      res.json({
        success: true,
        total: records.length,
        records,
      });
    } catch (error) {
      console.error('Admin RTO error:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to fetch RTO records.',
      });
    }
  }
);

// ADMIN: INITIATE RTO
router.post(
  '/admin',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const { shipmentId, reason, remarks } = req.body;

      if (!shipmentId || !reason?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Shipment ID and RTO reason are required.',
        });
      }

      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
      });

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found.',
        });
      }

      const existing = await prisma.rTORecord.findFirst({
        where: {
          shipmentId,
          status: {
            not: 'CANCELLED',
          },
        },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An active RTO record already exists.',
        });
      }

      const record = await prisma.$transaction(async (tx) => {
        const newRecord = await tx.rTORecord.create({
          data: {
            shipmentId,
            reason: reason.trim(),
            remarks: remarks?.trim() || null,
            status: 'INITIATED',
          },
        });

        await tx.shipment.update({
          where: { id: shipmentId },
          data: {
            status: 'RTO',
          },
        });

        return newRecord;
      });

      res.status(201).json({
        success: true,
        message: 'RTO initiated successfully.',
        record,
      });
    } catch (error) {
      console.error('RTO initiation error:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to initiate RTO.',
      });
    }
  }
);

// ADMIN: UPDATE RTO STATUS
router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const { status, remarks, returnAwb } = req.body;

      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid RTO status.',
        });
      }

      const existing = await prisma.rTORecord.findUnique({
        where: { id: req.params.id },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'RTO record not found.',
        });
      }

      const record = await prisma.rTORecord.update({
        where: { id: req.params.id },
        data: {
          status,
          remarks: remarks?.trim() ?? existing.remarks,
          returnAwb: returnAwb?.trim() || existing.returnAwb,
          deliveredAt:
            status === 'DELIVERED_TO_SELLER'
              ? new Date()
              : null,
        },
      });

      res.json({
        success: true,
        message: 'RTO status updated successfully.',
        record,
      });
    } catch (error) {
      console.error('RTO status update error:', error);
      res.status(500).json({
        success: false,
        message: 'Unable to update RTO status.',
      });
    }
  }
);

module.exports = router;
