
const express = require('express');
const crypto = require('crypto');
const prisma = require('../prisma');

const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

const router = express.Router();

const allowedCategories = [
  'DELIVERY',
  'PICKUP',
  'RTO',
  'CLAIM',
  'ACCOUNT',
  'GST',
];

// GENERATE UNIQUE TICKET NUMBER
function generateTicketNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const uniqueCode = crypto.randomBytes(3).toString('hex').toUpperCase();

  return `SN-TKT-${date}-${uniqueCode}`;
}

// CUSTOMER RAISES A SUPPORT TICKET
router.post(
  '/',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const {
        category,
        subject,
        message,
        shipmentId,
      } = req.body;

      if (!category || !allowedCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid ticket category.',
        });
      }

      if (
        typeof subject !== 'string' ||
        !subject.trim() ||
        typeof message !== 'string' ||
        !message.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Subject and message are required.',
        });
      }

      if (subject.trim().length > 150 || message.trim().length > 3000) {
        return res.status(400).json({
          success: false,
          message: 'Subject or message exceeds the allowed length.',
        });
      }

      const shipmentRequired = [
        'DELIVERY',
        'PICKUP',
        'RTO',
        'CLAIM',
      ].includes(category);

      if (shipmentRequired && !shipmentId) {
        return res.status(400).json({
          success: false,
          message: 'Please select the related shipment.',
        });
      }

      if (shipmentId) {
        const shipment = await prisma.shipment.findFirst({
          where: {
            id: shipmentId,
            customerId: req.user.userId,
          },
        });

        if (!shipment) {
          return res.status(404).json({
            success: false,
            message: 'Related shipment not found.',
          });
        }
      }

      const ticket = await prisma.supportTicket.create({
        data: {
          ticketNumber: generateTicketNumber(),
          customerId: req.user.userId,
          shipmentId: shipmentId || null,
          category,
          subject: subject.trim(),
          message: message.trim(),
        },
        include: {
          shipment: {
            select: {
              docketNumber: true,
              trackingId: true,
            },
          },
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Support ticket raised successfully.',
        ticket,
      });
    } catch (error) {
      console.error('Create support ticket error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to raise support ticket.',
      });
    }
  }
);

// CUSTOMER VIEWS THEIR OWN TICKETS
router.get(
  '/my',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const tickets = await prisma.supportTicket.findMany({
        where: {
          customerId: req.user.userId,
        },
        include: {
          shipment: {
            select: {
              docketNumber: true,
              trackingId: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.json({
        success: true,
        tickets,
      });
    } catch (error) {
      console.error('Get support tickets error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve support tickets.',
      });
    }
  }
);

module.exports = router;
