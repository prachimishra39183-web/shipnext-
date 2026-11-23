
const express = require('express');
const prisma = require('../prisma');

const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

const router = express.Router();

// ADMIN: View all blocked PIN codes
router.get(
  '/',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const blockedPincodes = await prisma.blockedPincode.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return res.json({
        success: true,
        blockedPincodes,
      });
    } catch (error) {
      console.error('Fetch blocked PINs error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to fetch blocked PIN codes.',
      });
    }
  }
);

// ADMIN: Block a PIN code
router.post(
  '/block',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const pincode = String(req.body.pincode || '').trim();
      const reason = String(req.body.reason || '').trim();

      if (!/^\d{6}$/.test(pincode)) {
        return res.status(400).json({
          success: false,
          message: 'Enter a valid six-digit PIN code.',
        });
      }

      const blocked = await prisma.blockedPincode.create({
        data: {
          pincode,
          reason: reason || null,
          blockedBy: req.user.userId,
        },
      });

      return res.status(201).json({
        success: true,
        message: `PIN code ${pincode} blocked successfully.`,
        blocked,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'This PIN code is already blocked.',
        });
      }

      console.error('Block PIN error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to block PIN code.',
      });
    }
  }
);

// ADMIN: Unblock a PIN code
router.delete(
  '/:pincode',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const pincode = String(req.params.pincode || '').trim();

      if (!/^\d{6}$/.test(pincode)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid PIN code.',
        });
      }

      await prisma.blockedPincode.delete({
        where: { pincode },
      });

      return res.json({
        success: true,
        message: `PIN code ${pincode} unblocked successfully.`,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Blocked PIN code not found.',
        });
      }

      console.error('Unblock PIN error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to unblock PIN code.',
      });
    }
  }
);

module.exports = router;
