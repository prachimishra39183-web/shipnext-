
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

module.exports = router;
