
const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

// SUBMIT ENQUIRY
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;

    if (
      !name?.trim() ||
      !phone?.trim() ||
      !message?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone and message are required.',
      });
    }

    if (!/^[0-9]{10}$/.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit phone number.',
      });
    }

    const cleanEmail = email?.trim().toLowerCase() || null;

    if (
      cleanEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    const enquiry = await prisma.enquiry.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: cleanEmail,
        message: message.trim(),
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Your enquiry has been submitted successfully.',
      enquiryId: enquiry.id,
    });
  } catch (error) {
    console.error('Submit enquiry error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to submit your enquiry.',
    });
  }
});

module.exports = router;
