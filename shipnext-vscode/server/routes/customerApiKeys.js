
const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const prisma = require('../prisma');
const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

router.use(authenticateToken, authorizeRole('CUSTOMER'));

// GET all API keys belonging to the logged-in customer
router.get('/', async (req, res) => {
  try {
    const keys = await prisma.customerApiKey.findMany({
      where: { userId: req.user.userId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastFour: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        revokedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, keys });
  } catch (error) {
    console.error('API keys fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API keys',
    });
  }
});

// CREATE a new API key
router.post('/', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();

    if (!name || name.length > 60) {
      return res.status(400).json({
        success: false,
        message: 'Enter a key name (maximum 60 characters)',
      });
    }

    const activeCount = await prisma.customerApiKey.count({
      where: {
        userId: req.user.userId,
        isActive: true,
      },
    });

    if (activeCount >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 active API keys allowed',
      });
    }

    const secret = `sn_live_${crypto.randomBytes(32).toString('hex')}`;
    const keyPrefix = secret.substring(0, 16);
    const lastFour = secret.slice(-4);

    const keyHash = crypto
      .createHash('sha256')
      .update(secret)
      .digest('hex');

    const key = await prisma.customerApiKey.create({
      data: {
        userId: req.user.userId,
        name,
        keyPrefix,
        keyHash,
        lastFour,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastFour: true,
        isActive: true,
        createdAt: true,
      },
    });

    // The full secret is returned only during creation.
    res.status(201).json({
      success: true,
      message: 'API key generated. Copy it now; it cannot be viewed again.',
      key,
      apiKey: secret,
    });
  } catch (error) {
    console.error('API key creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate API key',
    });
  }
});

// REVOKE an API key
router.delete('/:id', async (req, res) => {
  try {
    const existingKey = await prisma.customerApiKey.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.userId,
        isActive: true,
      },
    });

    if (!existingKey) {
      return res.status(404).json({
        success: false,
        message: 'Active API key not found',
      });
    }

    await prisma.customerApiKey.update({
      where: { id: existingKey.id },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (error) {
    console.error('API key revocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke API key',
    });
  }
});

module.exports = router;
