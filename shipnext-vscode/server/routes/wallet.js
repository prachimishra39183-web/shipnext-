
const express = require('express');
const prisma = require('../prisma');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

const router = express.Router();

const paymentProofUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, WEBP and PDF files are allowed.'));
    }

    cb(null, true);
  },
});

function encryptPaymentProof(buffer) {
  const key = Buffer.from(
    process.env.KYC_ENCRYPTION_KEY || '',
    'base64'
  );

  if (key.length !== 32) {
    throw new Error('Payment proof encryption key is missing or invalid.');
  }

  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encryptedData = Buffer.concat([
    cipher.update(buffer),
    cipher.final(),
  ]);

  return {
    encryptedData,
    encryptionIv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
  };
}

function isValidPaymentProof(buffer, mimeType) {
  if (mimeType === 'image/jpeg') {
    return buffer.subarray(0, 3).equals(
      Buffer.from([0xff, 0xd8, 0xff])
    );
  }

  if (mimeType === 'image/png') {
    return buffer.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    );
  }

  if (mimeType === 'image/webp') {
    return (
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    );
  }

  if (mimeType === 'application/pdf') {
    return buffer.toString('ascii', 0, 5) === '%PDF-';
  }

  return false;
}


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

router.post(
  '/recharge-requests',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  (req, res, next) => {
    paymentProofUpload.single('paymentProof')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Invalid payment screenshot.',
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const { amount, upiReference, paymentMethod } = req.body;

      const amountString = String(amount ?? '').trim();
      const reference = String(upiReference ?? '').trim();
      const method = String(paymentMethod ?? '').trim();

      if (
        !/^\d+(\.\d{1,2})?$/.test(amountString) ||
        !Number.isFinite(Number(amountString)) ||
        Number(amountString) < 1 ||
        Number(amountString) > 1000000
      ) {
        return res.status(400).json({
          success: false,
          message: 'Enter a valid recharge amount between ₹1 and ₹10,00,000.',
        });
      }

      const allowedMethods = ['UPI', 'CREDIT_CARD', 'DEBIT_CARD'];

      if (!allowedMethods.includes(method)) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid payment method.',
        });
      }

      if (!reference || reference.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid payment reference or transaction ID.',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload your payment screenshot.',
        });
      }

      if (!isValidPaymentProof(req.file.buffer, req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'The uploaded file does not match its file type.',
        });
      }

     
const encryptedProof = encryptPaymentProof(req.file.buffer);

const recharge = await prisma.$transaction(async (tx) => {
  // Create wallet if it does not exist, or add the recharge amount.
  const wallet = await tx.wallet.upsert({
    where: {
      userId: req.user.userId,
    },
    update: {
      balance: {
        increment: amountString,
      },
    },
    create: {
      userId: req.user.userId,
      balance: amountString,
    },
  });

  // Save recharge details and encrypted payment proof.
  const request = await tx.walletRechargeRequest.create({
    data: {
      userId: req.user.userId,
      amount: amountString,
      upiReference: reference,
      paymentMethod: method,
      proofOriginalName: path.basename(req.file.originalname).slice(0, 150),
      proofMimeType: req.file.mimetype,
      proofFileSize: req.file.size,
      proofEncryptedData: encryptedProof.encryptedData,
      proofEncryptionIv: encryptedProof.encryptionIv,
      proofAuthTag: encryptedProof.authTag,
    },
  });

  // Record the wallet credit.
  await tx.walletTransaction.create({
    data: {
      userId: req.user.userId,
      walletId: wallet.id,
      type: 'CREDIT',
      amount: amountString,
      description: 'Wallet recharge through ' + method,
      reference: 'WALLET_RECHARGE_' + reference,
    },
  });

  return {
    request,
    wallet,
  };
});

return res.status(201).json({
  success: true,
  message: 'Wallet recharged successfully.',
  rechargeRequest: {
    id: recharge.request.id,
    amount: recharge.request.amount.toString(),
    paymentMethod: recharge.request.paymentMethod,
    upiReference: recharge.request.upiReference,
    createdAt: recharge.request.createdAt,
    status: 'COMPLETED',
  },
  balance: recharge.wallet.balance.toString(),
});

    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'This payment reference has already been submitted.',
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
