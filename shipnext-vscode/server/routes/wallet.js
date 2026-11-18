
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

      const customer = await prisma.user.findUnique({
        where: {
          id: req.user.userId,
        },
        select: {
          name: true,
        },
      });

      const rechargeRequest = await prisma.$transaction(async (tx) => {
        const request = await tx.walletRechargeRequest.create({
          data: {
            userId: req.user.userId,
            amount: amountString,
            upiReference: reference,
          },
        });

        await tx.adminNotification.create({
          data: {
            title: 'New Wallet Top-up Request',
            message: `${customer?.name || 'A customer'} submitted a wallet top-up request of ₹${amountString}. UPI Reference: ${reference}`,
            type: 'WALLET_TOPUP',
            link: '/admin/wallet',
          },
        });

        return request;
      });

      return res.status(201).json({
        success: true,
        message: 'Your recharge request has been submitted successfully.',
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
        where: {
          userId: req.user.userId,
        },
        select: {
          id: true,
          amount: true,
          upiReference: true,
          paymentMethod: true,
          createdAt: true,
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

module.exports = router;
