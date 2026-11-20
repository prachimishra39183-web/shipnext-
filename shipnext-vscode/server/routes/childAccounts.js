
const express = require('express');
const prisma = require('../prisma');
const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

const router = express.Router();

// GET CHILD ACCOUNTS BELONGING TO LOGGED-IN PARENT
router.get(
  '/',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const children = await prisma.childAccount.findMany({
        where: { parentId: req.user.id },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        total: children.length,
        children,
      });
    } catch (error) {
      console.error('Child account fetch error:', error);
      res.status(500).json({ message: 'Unable to load child accounts.' });
    }
  }
);

// CREATE A CHILD ACCOUNT
router.post(
  '/',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const {
        accountName,
        branchName,
        branchCode,
        contactPerson,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        dailyShipmentLimit,
        dailyWalletLimit,
      } = req.body;

      const required = {
        accountName, branchName, branchCode, contactPerson,
        email, phone, address, city, state, pincode,
      };

      if (Object.values(required).some(
        value => typeof value !== 'string' || !value.trim()
      )) {
        return res.status(400).json({
          message: 'Please complete all required branch details.',
        });
      }

      const shipmentLimit =
        dailyShipmentLimit === '' || dailyShipmentLimit == null
          ? null
          : Number(dailyShipmentLimit);

      const walletLimit =
        dailyWalletLimit === '' || dailyWalletLimit == null
          ? null
          : Number(dailyWalletLimit);

      if (
        shipmentLimit !== null &&
        (!Number.isInteger(shipmentLimit) || shipmentLimit < 1)
      ) {
        return res.status(400).json({
          message: 'Daily shipment limit must be a positive whole number.',
        });
      }

      if (
        walletLimit !== null &&
        (!Number.isFinite(walletLimit) || walletLimit < 0)
      ) {
        return res.status(400).json({
          message: 'Daily wallet limit must be zero or greater.',
        });
      }
     const customer = await prisma.user.findUnique({
  where: { id: req.user.id },
  select: { name: true, email: true },
});
      const child = await prisma.childAccount.create({
        data: {
          parentId: req.user.id,
          accountName: accountName.trim(),
          branchName: branchName.trim(),
          branchCode: branchCode.trim().toUpperCase(),
          contactPerson: contactPerson.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          dailyShipmentLimit: shipmentLimit,
          dailyWalletLimit: walletLimit,
          status: 'INACTIVE',
        },
      });
     // Notify admins about the new child account.
await prisma.adminNotification.create({
  data: {
    title: 'New Child Account Created',
    message: `${customer?.name || customer?.email || 'A customer'} created branch "${branchName.trim()}" (${branchCode.trim().toUpperCase()}).`,
    type: 'CHILD_ACCOUNT_CREATED',
    link: '/admin/child-accounts',
  },
});
      res.status(201).json({
        success: true,
        message: 'Child account created successfully.',
        child,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          message: 'This branch code is already used by your account.',
        });
      }

      console.error('Child account creation error:', error);
      res.status(500).json({ message: 'Unable to create child account.' });
    }
  }
);

// UPDATE OWN CHILD ACCOUNT
router.patch(
  '/:id',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const existing = await prisma.childAccount.findFirst({
        where: {
          id: req.params.id,
          parentId: req.user.id,
        },
      });

      if (!existing) {
        return res.status(404).json({
          message: 'Child account not found.',
        });
      }

      const allowedFields = [
        'accountName', 'branchName', 'branchCode',
        'contactPerson', 'email', 'phone', 'address',
        'city', 'state', 'pincode',
        'dailyShipmentLimit', 'dailyWalletLimit',
      ];

      const data = {};

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          data[field] = req.body[field];
        }
      }

      if (data.branchCode !== undefined) {
        data.branchCode = String(data.branchCode).trim().toUpperCase();
      }

      if (data.email !== undefined) {
        data.email = String(data.email).trim().toLowerCase();
      }

      const child = await prisma.childAccount.update({
        where: { id: existing.id },
        data,
      });

      res.json({
        success: true,
        message: 'Child account updated successfully.',
        child,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          message: 'This branch code is already in use.',
        });
      }

      console.error('Child account update error:', error);
      res.status(500).json({ message: 'Unable to update child account.' });
    }
  }
);

// CHANGE STATUS OF OWN CHILD ACCOUNT
router.patch(
  '/:id/status',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!['ACTIVE', 'INACTIVE'].includes(status)) {
        return res.status(400).json({
          message: 'Status must be ACTIVE or INACTIVE.',
        });
      }

      const existing = await prisma.childAccount.findFirst({
        where: {
          id: req.params.id,
          parentId: req.user.id,
        },
      });

      if (!existing) {
        return res.status(404).json({
          message: 'Child account not found.',
        });
      }

      const child = await prisma.childAccount.update({
        where: { id: existing.id },
        data: { status },
      });

      res.json({
        success: true,
        message: 'Child account status updated.',
        child,
      });
    } catch (error) {
      console.error('Child account status error:', error);
      res.status(500).json({ message: 'Unable to update status.' });
    }
  }
);

module.exports = router;
