
const express = require('express');
const prisma = require('../prisma');

const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

const router = express.Router();

const allowedStatuses = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
];

// ADMIN VIEWS ALL SUPPORT TICKETS
router.get(
  '/',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const tickets = await prisma.supportTicket.findMany({
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          shipment: {
            select: {
              id: true,
              docketNumber: true,
              trackingId: true,
              pickupPincode: true,
              deliveryPincode: true,
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
        stats: {
          total: tickets.length,
          open: tickets.filter(t => t.status === 'OPEN').length,
          inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
          resolved: tickets.filter(t => t.status === 'RESOLVED').length,
          closed: tickets.filter(t => t.status === 'CLOSED').length,
        },
      });
    } catch (error) {
      console.error('Get admin support tickets error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve support tickets.',
      });
    }
  }
);

// ADMIN UPDATES TICKET STATUS AND REPLY
router.patch(
  '/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const { status, adminReply } = req.body;

      if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ticket status.',
        });
      }

      if (
        adminReply !== undefined &&
        (typeof adminReply !== 'string' || adminReply.length > 3000)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Admin reply must be text and cannot exceed 3000 characters.',
        });
      }

      if (status === undefined && adminReply === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a status or admin reply.',
        });
      }

      const existingTicket = await prisma.supportTicket.findUnique({
        where: {
          id: req.params.id,
        },
      });

      if (!existingTicket) {
        return res.status(404).json({
          success: false,
          message: 'Support ticket not found.',
        });
      }

      const ticket = await prisma.supportTicket.update({
        where: {
          id: req.params.id,
        },
        data: {
          ...(status !== undefined && { status }),
          ...(adminReply !== undefined && {
            adminReply: adminReply.trim(),
          }),
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          shipment: {
            select: {
              docketNumber: true,
              trackingId: true,
            },
          },
        },
      });

      return res.json({
        success: true,
        message: 'Support ticket updated successfully.',
        ticket,
      });
    } catch (error) {
      console.error('Update support ticket error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to update support ticket.',
      });
    }
  }
);

module.exports = router;
