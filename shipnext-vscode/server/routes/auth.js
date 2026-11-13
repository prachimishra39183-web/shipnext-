
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
// CUSTOMER REGISTRATION
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters.'
      });
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

    const user = await prisma.user.create({
      data: {
        name: fullName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        passwordHash,
        role: 'CUSTOMER',
        wallet: {
          create: {
            balance: 0
          }
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
      message: 'ShipNext account created successfully.',
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
});

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
