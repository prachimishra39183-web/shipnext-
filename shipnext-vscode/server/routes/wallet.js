
const express = require('express');
const prisma = require('../prisma');
const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

const router = express.Router();

// GET CUSTOMER WALLET BALANCE AND TRANSACTION HISTORY
router.get(
  '/me',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const wallet = await prisma.wallet.upsert({
        where: {
          userId: req.user.userId,
        },
        update: {},
        create: {
          userId: req.user.userId,
        },
        include: {
          transactions: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 50,
          },
        },
      });

      return res.json({
        success: true,
        wallet: {
          balance: wallet.balance.toString(),
          transactions: wallet.transactions,
        },
      });
    } catch (error) {
      console.error('Get wallet error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve wallet details.',
      });
    }
  }
);

// CUSTOMER: SUBMIT A WALLET RECHARGE REQUEST
router.post(
  '/recharge-requests',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const { amount, upiReference } = req.body;

      const amountString = String(amount ?? '').trim();
      const reference = String(upiReference ?? '').trim();

      if (
        !/^\d+(\.\d{1,2})?$/.test(amountString) ||
        !Number.isFinite(Number(amountString)) ||
        Number(amountString) < 100
      ) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid amount of at least ₹100.',
        });
      }

      if (!reference || reference.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid UPI transaction reference.',
        });
      }

      const rechargeRequest =
        await prisma.walletRechargeRequest.create({
          data: {
            userId: req.user.userId,
            amount: amountString,
            upiReference: reference,
          },
        });
         const customer = await prisma.user.findUnique({
  where: { id: req.user.userId },
  select: { name: true },
});

await prisma.adminNotification.create({
  data: {
    title: 'New Wallet Top-up Request',
    message: `${customer?.name || 'A customer'} requested a wallet top-up of ₹${amountString}. UPI Reference: ${reference}`,
    type: 'WALLET_TOPUP',
    link: '/admin/wallet',
  },
});
      return res.status(201).json({
        success: true,
        message: 'Recharge request submitted for verification.',
        rechargeRequest,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'This UPI transaction reference has already been submitted.',
        });
      }

      console.error('Create recharge request error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to submit recharge request.',
      });
    }
  }
);

// CUSTOMER: VIEW OWN RECHARGE REQUESTS
router.get(
  '/recharge-requests',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const requests = await prisma.walletRechargeRequest.findMany({
  select: {
    id: true,
    amount: true,
    upiReference: true,
    paymentMethod: true,
    status: true,
    adminNote: true,
    verifiedAt: true,
    createdAt: true,
    user: {
      select: {
        name: true,
        email: true,
        phone: true,
      },
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
});
      return res.json({
        success: true,
        requests,
      });
    } catch (error) {
      console.error('Get customer recharge requests error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve recharge requests.',
      });
    }
  }
);

// ADMIN: VIEW ALL RECHARGE REQUESTS
router.get(
  '/admin/recharge-requests',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const requests = await prisma.walletRechargeRequest.findMany({
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.json({
        success: true,
        requests,
      });
    } catch (error) {
      console.error('Admin get recharge requests error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve recharge requests.',
      });
    }
  }
);

// ADMIN: APPROVE OR REJECT A RECHARGE REQUEST
router.patch(
  '/admin/recharge-requests/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const { status, adminNote } = req.body;
      const requestId = req.params.id;

      if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be APPROVED or REJECTED.',
        });
      }

      const note =
        typeof adminNote === 'string'
          ? adminNote.trim().slice(0, 500)
          : null;

      const updatedRequest = await prisma.$transaction(async (tx) => {
        const request = await tx.walletRechargeRequest.findUnique({
          where: {
            id: requestId,
          },
        });

        if (!request) {
          const error = new Error('Recharge request not found.');
          error.statusCode = 404;
          throw error;
        }

        if (request.status !== 'PENDING') {
          const error = new Error(
            'This recharge request has already been reviewed.'
          );
          error.statusCode = 409;
          throw error;
        }

        const updateResult = await tx.walletRechargeRequest.updateMany({
          where: {
            id: requestId,
            status: 'PENDING',
          },
          data: {
            status,
            adminNote: note,
            verifiedBy: req.user.userId,
            verifiedAt: new Date(),
          },
        });

        if (updateResult.count !== 1) {
          const error = new Error(
            'This recharge request has already been reviewed.'
          );
          error.statusCode = 409;
          throw error;
        }

        // CREDIT THE WALLET ONLY AFTER ADMIN APPROVAL
        if (status === 'APPROVED') {
          const wallet = await tx.wallet.upsert({
            where: {
              userId: request.userId,
            },
            update: {
              balance: {
                increment: request.amount,
              },
            },
            create: {
              userId: request.userId,
              balance: request.amount,
            },
          });

          await tx.walletTransaction.create({
            data: {
              userId: request.userId,
              walletId: wallet.id,
              type: 'CREDIT',
              amount: request.amount,
              description: 'Wallet recharge via UPI',
              reference: `WALLET_RECHARGE_${request.id}`,
            },
          });
        }

        return tx.walletRechargeRequest.findUnique({
          where: {
            id: requestId,
          },
        });
      });

      return res.json({
        success: true,
        message:
          status === 'APPROVED'
            ? 'Recharge approved and wallet credited successfully.'
            : 'Recharge request rejected.',
        rechargeRequest: updatedRequest,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      console.error('Review recharge request error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to review recharge request.',
      });
    }
  }
);

module.exports = router;
