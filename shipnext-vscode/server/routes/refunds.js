
const express = require('express');
const prisma = require('../prisma');
const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

const router = express.Router();

// CUSTOMER: SUBMIT REFUND REQUEST
router.post(
  '/request',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const { amount, reason, shipmentId } = req.body;

      const amountString = String(amount || '');

      if (
        !/^\d+(\.\d{1,2})?$/.test(amountString) ||
        !Number.isFinite(Number(amountString)) ||
        Number(amountString) <= 0 ||
        Number(amountString) > 1000000
      ) {
        return res.status(400).json({
          success: false,
          message: 'Enter a valid refund amount.',
        });
      }

      if (!reason || !reason.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a refund reason.',
        });
      }

      if (shipmentId) {
        const shipment = await prisma.shipment.findFirst({
          where: {
            id: shipmentId,
            customerId: req.user.userId,
          },
        });

        if (!shipment) {
          return res.status(404).json({
            success: false,
            message: 'Shipment not found.',
          });
        }

        if (Number(amountString) > Number(shipment.shippingCharge)) {
          return res.status(400).json({
            success: false,
            message: 'Refund cannot exceed the shipment shipping charge.',
          });
        }
      }

      const refund = await prisma.refundRequest.create({
        data: {
          userId: req.user.userId,
          shipmentId: shipmentId || null,
          amount: amountString,
          reason: reason.trim(),
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Refund request submitted successfully.',
        refund,
      });
    } catch (error) {
      console.error('Create refund error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to submit refund request.',
      });
    }
  }
);

// CUSTOMER: VIEW OWN REFUND REQUESTS
router.get(
  '/my',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const refunds = await prisma.refundRequest.findMany({
        where: {
          userId: req.user.userId,
        },
        include: {
          shipment: {
            select: {
              trackingId: true,
              docketNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.json({
        success: true,
        refunds,
      });
    } catch (error) {
      console.error('Get customer refunds error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve refund requests.',
      });
    }
  }
);

// ADMIN: VIEW ALL REFUND REQUESTS
router.get(
  '/',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const refunds = await prisma.refundRequest.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          shipment: {
            select: {
              trackingId: true,
              docketNumber: true,
              shippingCharge: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.json({
        success: true,
        refunds,
      });
    } catch (error) {
      console.error('Get admin refunds error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve refund requests.',
      });
    }
  }
);

// ADMIN: APPROVE REFUND
router.patch(
  '/:id/approve',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const result = await prisma.refundRequest.updateMany({
        where: {
          id: req.params.id,
          status: 'PENDING',
        },
        data: {
          status: 'APPROVED',
          adminNote: req.body.adminNote || null,
        },
      });

      if (result.count === 0) {
        return res.status(400).json({
          success: false,
          message: 'Refund not found or already processed.',
        });
      }

      return res.json({
        success: true,
        message: 'Refund approved successfully.',
      });
    } catch (error) {
      console.error('Approve refund error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to approve refund.',
      });
    }
  }
);

// ADMIN: REJECT REFUND
router.patch(
  '/:id/reject',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const { adminNote } = req.body;

      if (!adminNote || !adminNote.trim()) {
        return res.status(400).json({
          success: false,
          message: 'A rejection reason is required.',
        });
      }

      const result = await prisma.refundRequest.updateMany({
        where: {
          id: req.params.id,
          status: 'PENDING',
        },
        data: {
          status: 'REJECTED',
          adminNote: adminNote.trim(),
        },
      });

      if (result.count === 0) {
        return res.status(400).json({
          success: false,
          message: 'Refund not found or already processed.',
        });
      }

      return res.json({
        success: true,
        message: 'Refund rejected successfully.',
      });
    } catch (error) {
      console.error('Reject refund error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to reject refund.',
      });
    }
  }
);

// ADMIN: PROCESS APPROVED REFUND AND CREDIT CUSTOMER WALLET
router.patch(
  '/:id/process',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Atomically claim the approved refund.
        const updated = await tx.refundRequest.updateMany({
          where: {
            id: req.params.id,
            status: 'APPROVED',
          },
          data: {
            status: 'COMPLETED',
            processedAt: new Date(),
          },
        });

        if (updated.count !== 1) {
          return null;
        }

        const refund = await tx.refundRequest.findUnique({
          where: {
            id: req.params.id,
          },
        });

        const wallet = await tx.wallet.upsert({
          where: {
            userId: refund.userId,
          },
          update: {
            balance: {
              increment: refund.amount,
            },
          },
          create: {
            userId: refund.userId,
            balance: refund.amount,
          },
        });

        await tx.walletTransaction.create({
          data: {
            userId: refund.userId,
            walletId: wallet.id,
            type: 'REFUND',
            amount: refund.amount,
            description: 'Approved refund credited to ShipNext wallet',
            reference: `REFUND_${refund.id}`,
          },
        });

        return {
          refund,
          balance: wallet.balance.toString(),
        };
      });

      if (!result) {
        return res.status(400).json({
          success: false,
          message: 'Refund is not approved or has already been processed.',
        });
      }

      return res.json({
        success: true,
        message: 'Refund credited to customer wallet successfully.',
        balance: result.balance,
      });
    } catch (error) {
      console.error('Process refund error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to process refund.',
      });
    }
  }
);

module.exports = router;
