const express = require('express');
const crypto = require('crypto');
const prisma = require('../prisma');
const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

const router = express.Router();

// Use the existing 32-byte base64 KYC encryption key.
const getEncryptionKey = () => {
  const key = Buffer.from(process.env.KYC_ENCRYPTION_KEY || '', 'base64');

  if (key.length !== 32) {
    throw new Error('KYC_ENCRYPTION_KEY must be a valid base64-encoded 32-byte key.');
  }

  return key;
};

// Encrypt sensitive profile values using AES-256-GCM.
const encryptValue = (value) => {
  if (!value) return null;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(String(value), 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
};

// Decrypt values for the authenticated customer.
const decryptValue = (value) => {
  if (!value) return '';

  const [ivText, tagText, encryptedText] = value.split(':');

  if (!ivText || !tagText || !encryptedText) {
    throw new Error('Invalid encrypted profile value.');
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(ivText, 'base64')
  );

  decipher.setAuthTag(Buffer.from(tagText, 'base64'));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, 'base64')),
    decipher.final(),
  ]).toString('utf8');
};

// Return only the profile fields, never passwordHash.
const formatProfile = (user) => ({
  fullName: user.name || '',
  email: user.email || '',
  phone: user.phone || '',
  address: user.address || '',
  pincode: user.pincode || '',
  companyName: user.companyName || '',
city: user.city || '',
state: user.state || '',
companyLogoUrl: user.companyLogoUrl || '',

  panNumber: decryptValue(user.panNumberEncrypted),
  aadhaarNumber: decryptValue(user.aadhaarNumberEncrypted),
  gstNumber: decryptValue(user.gstNumberEncrypted),
  bankName: user.bankName || '',
  accountHolderName: user.accountHolderName || '',
  accountNumber: decryptValue(user.accountNumberEncrypted),
  branchName: user.branchName || '',
  ifscCode: user.ifscCode || '',
});

// CUSTOMER: GET OWN PROFILE
router.get(
  '/me',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found.',
        });
      }

      return res.json({
        success: true,
        profile: formatProfile(user),
      });
    } catch (error) {
      console.error('Get profile error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to load profile.',
      });
    }
  }
);

// CUSTOMER: UPDATE OWN PROFILE
router.put(
  '/me',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const {
        fullName,
        email,
        phone,
        address,
        pincode,
        panNumber,
        aadhaarNumber,
        gstNumber,
        bankName,
        accountHolderName,
        accountNumber,
        branchName,
        ifscCode,
        companyName,
city,
state,
companyLogoUrl,
      } = req.body;

      const clean = (value) =>
        typeof value === 'string' ? value.trim() : '';

      const pan = clean(panNumber).toUpperCase();
      const aadhaar = clean(aadhaarNumber);
      const gst = clean(gstNumber).toUpperCase();
      const account = clean(accountNumber);
      const ifsc = clean(ifscCode).toUpperCase();
      const mobile = clean(phone);
      const pin = clean(pincode);

      if (!clean(fullName) || !clean(email)) {
        return res.status(400).json({
          success: false,
          message: 'Full name and email are required.',
        });
      }

      if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
        return res.status(400).json({
          success: false,
          message: 'Enter a valid PAN number.',
        });
      }

      if (aadhaar && !/^[0-9]{12}$/.test(aadhaar)) {
        return res.status(400).json({
          success: false,
          message: 'Aadhaar number must contain 12 digits.',
        });
      }

      if (gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(gst)) {
        return res.status(400).json({
          success: false,
          message: 'Enter a valid GST number.',
        });
      }

      if (mobile && !/^[0-9]{10}$/.test(mobile)) {
        return res.status(400).json({
          success: false,
          message: 'Enter a valid 10-digit mobile number.',
        });
      }

      if (pin && !/^[0-9]{6}$/.test(pin)) {
        return res.status(400).json({
          success: false,
          message: 'Enter a valid 6-digit PIN code.',
        });
      }

      if (account && !/^[0-9]{6,20}$/.test(account)) {
        return res.status(400).json({
          success: false,
          message: 'Enter a valid bank account number.',
        });
      }

      if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
        return res.status(400).json({
          success: false,
          message: 'Enter a valid IFSC code.',
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user.userId },
        data: {
          name: clean(fullName),
          email: clean(email).toLowerCase(),
          phone: mobile || null,
          address: clean(address) || null,
          pincode: pin || null,

          panNumberEncrypted: encryptValue(pan),
          aadhaarNumberEncrypted: encryptValue(aadhaar),
          gstNumberEncrypted: encryptValue(gst),

          bankName: clean(bankName) || null,
          accountHolderName: clean(accountHolderName) || null,
          accountNumberEncrypted: encryptValue(account),
          branchName: clean(branchName) || null,
          ifscCode: ifsc || null,
          companyName: clean(companyName) || null,
city: clean(city) || null,
state: clean(state) || null,
companyLogoUrl: clean(companyLogoUrl) || null,
        },
      });

      return res.json({
        success: true,
        message: 'Profile saved successfully.',
        profile: formatProfile(updatedUser),
      });
    } catch (error) {
      console.error('Update profile error:', error);

      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'This email or mobile number is already in use.',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Unable to save profile.',
      });
    }
  }
);

module.exports = router;