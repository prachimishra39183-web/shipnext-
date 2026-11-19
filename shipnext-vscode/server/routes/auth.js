
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

const router = express.Router();
const kycUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 3
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG and PDF documents are allowed.'));
    }

    cb(null, true);
  }
});

function encryptKycDocument(buffer) {
  const key = Buffer.from(process.env.KYC_ENCRYPTION_KEY || '', 'base64');

  if (key.length !== 32) {
    throw new Error('KYC encryption key is missing or invalid.');
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encryptedData = Buffer.concat([
    cipher.update(buffer),
    cipher.final()
  ]);

  return {
    encryptedData,
    encryptionIv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex')
  };
}

function isValidDocumentFile(file) {
  const buffer = file.buffer;

  if (file.mimetype === 'image/jpeg') {
    return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  }

  if (file.mimetype === 'image/png') {
    return buffer.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    );
  }

  if (file.mimetype === 'application/pdf') {
    return buffer.subarray(0, 5).toString() === '%PDF-';
  }

  return false;
}
const { authenticateToken } = require('../middleware/auth');
// CUSTOMER REGISTRATION
router.post(
  '/register',
  (req, res, next) => {
    kycUpload.fields([
      { name: 'aadhaar', maxCount: 1 },
      { name: 'pan', maxCount: 1 },
      { name: 'cancelledCheque', maxCount: 1 }
    ])(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.code === 'LIMIT_FILE_SIZE'
            ? 'Each document must be 5 MB or smaller.'
            : err.message
        });
      }

      next();
    });
  },
  async (req, res) => {
    try {
      const { fullName, email, phone, password } = req.body;

      const files = req.files || {};

      const aadhaar = files.aadhaar?.[0];
      const pan = files.pan?.[0];
      const cancelledCheque = files.cancelledCheque?.[0];

      if (!fullName || !email || !phone || !password ||
          !aadhaar || !pan || !cancelledCheque) {
        return res.status(400).json({
          success: false,
          message: 'Please complete all fields and upload all three documents.'
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters.'
        });
      }

      const documents = [
        { file: aadhaar, type: 'AADHAAR' },
        { file: pan, type: 'PAN' },
        { file: cancelledCheque, type: 'CANCELLED_CHEQUE' }
      ];

      for (const document of documents) {
        if (!isValidDocumentFile(document.file)) {
          return res.status(400).json({
            success: false,
            message: `Invalid file format for ${document.type}.`
          });
        }
      }

      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.'
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const documentRecords = documents.map(({ file, type }) => ({
        documentType: type,
        originalName: path.basename(file.originalname).slice(0, 150),
        mimeType: file.mimetype,
        fileSize: file.size,
        ...encryptKycDocument(file.buffer)
      }));

      const user = await prisma.user.create({
        data: {
          name: fullName.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
          passwordHash,
          role: 'CUSTOMER',
          isActive: true,

          wallet: {
            create: { balance: 0 }
          },

          customerDocuments: {
            create: documentRecords
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true
        }
      });

      return res.status(201).json({
        success: true,
        message: 'ShipNext account and KYC documents created successfully.',
        user
      });

    } catch (error) {
      console.error('Registration error:', error);

      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Email or mobile number is already registered.'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.'
      });
    }
  }
);
// CUSTOMER AND ADMIN LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});


// VERIFY LOGGED-IN USER
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or inactive.'
      });
    }

    return res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('User verification error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to verify user.'
    });
  }
});

module.exports = router;
