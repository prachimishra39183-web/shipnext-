
const express = require('express');
const prisma = require('../prisma');
const { Prisma } = require('@prisma/client');
const {
  authenticateToken,
  authorizeRole
} = require('../middleware/auth');

const router = express.Router();

// GET ALL REGISTERED CUSTOMERS
router.get(
  '/customers',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
     const shipments = await prisma.shipment.findMany({
  include: {
    customer: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true
      }
    }
  },
  orderBy: {
    createdAt: 'desc'
  }
});

      return res.json({
        success: true,
        totalCustomers: customers.length,
        customers
      });

    } catch (error) {
      console.error('Admin customers error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve customers.'
      });
    }
  }
);

// GET ALL SHIPMENTS
router.get(
  '/shipments',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const shipments = await prisma.shipment.findMany({
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const stats = {
        total: shipments.length,
        inTransit: shipments.filter(
          shipment => shipment.status === 'IN_TRANSIT'
        ).length,
        delivered: shipments.filter(
          shipment => shipment.status === 'DELIVERED'
        ).length,
        pending: shipments.filter(
          shipment => shipment.status === 'PENDING'
        ).length
      };

      return res.json({
        success: true,
        stats,
        totalShipments: shipments.length,
        shipments
      });

    } catch (error) {
      console.error('Admin shipments error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve shipments.'
      });
    }
  }
);


router.get(
  '/wallets',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const [customers, walletTotals, transactionGroups, totalTransactions] =
        await Promise.all([
          prisma.user.findMany({
            where: {
              role: 'CUSTOMER',
            },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
              wallet: {
                select: {
                  id: true,
                  balance: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          }),

          prisma.wallet.aggregate({
            _sum: {
              balance: true,
            },
          }),

          prisma.walletTransaction.groupBy({
            by: ['type'],
            _sum: {
              amount: true,
            },
          }),

          prisma.walletTransaction.count(),
        ]);

      const amounts = {};

      transactionGroups.forEach((group) => {
        amounts[group.type] = group._sum.amount || new Prisma.Decimal(0);
      });

      const totalCredits = (amounts.CREDIT || new Prisma.Decimal(0))
        .plus(amounts.REFUND || new Prisma.Decimal(0))
        .toString();

      const totalDebits = (
        amounts.DEBIT || new Prisma.Decimal(0)
      ).toString();

      const wallets = customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        isActive: customer.isActive,
        walletId: customer.wallet?.id || null,
        balance: customer.wallet?.balance.toString() || '0.00',
      }));

      return res.json({
        success: true,
        stats: {
          totalCustomers: wallets.length,
          totalWalletBalance:
            walletTotals._sum.balance?.toString() || '0.00',
          totalCredits,
          totalDebits,
          totalTransactions,
        },
        wallets,
      });
    } catch (error) {
      console.error('Admin wallet error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve customer wallet records.',
      });
    }
  }
);
// GET ALL WALLET TRANSACTIONS (ADMIN)
router.get(
  '/wallet-transactions',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const transactions = await prisma.walletTransaction.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      });

      return res.json({
        success: true,
        transactions: transactions.map((transaction) => ({
          id: transaction.id,
          customer: transaction.user.name,
          email: transaction.user.email,
          phone: transaction.user.phone,
          type: transaction.type,
          amount: transaction.amount.toString(),
          description: transaction.description,
          reference: transaction.reference,
          createdAt: transaction.createdAt,
        })),
      });
    } catch (error) {
      console.error('Admin wallet transactions error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve wallet transactions.',
      });
    }
  }
);

// GET ALL CUSTOMER ENQUIRIES (ADMIN)
router.get(
  '/enquiries',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const search = req.query.search?.trim();

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
              { message: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};

      const [enquiries, total, resolved, newCount] = await Promise.all([
        prisma.enquiry.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.enquiry.count(),
        prisma.enquiry.count({ where: { isResolved: true } }),
        prisma.enquiry.count({ where: { isResolved: false } }),
      ]);

      return res.json({
        success: true,
        stats: {
          total,
          new: newCount,
          inProgress: 0,
          resolved,
        },
        enquiries,
      });
    } catch (error) {
      console.error('Admin enquiries error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve enquiries.',
      });
    }
  }
);

// MARK ENQUIRY AS RESOLVED OR UNRESOLVED (ADMIN)
router.patch(
  '/enquiries/:id/resolve',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const { isResolved } = req.body;

      if (typeof isResolved !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'A valid resolution status is required.',
        });
      }

      const enquiry = await prisma.enquiry.update({
        where: { id: req.params.id },
        data: { isResolved },
      });

      return res.json({
        success: true,
        message: 'Enquiry status updated successfully.',
        enquiry,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Enquiry not found.',
        });
      }

      console.error('Update enquiry error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to update enquiry status.',
      });
    }
  }
);

// UPDATE SHIPMENT STATUS AND CREATE CUSTOMER NOTIFICATION
router.patch(
  '/shipments/:id/status',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const { status } = req.body;

      const validStatuses = [
        'PENDING',
        'CONFIRMED',
        'PICKED_UP',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'RTO',
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid shipment status.',
        });
      }

      const shipment = await prisma.shipment.findUnique({
        where: { id: req.params.id },
      });

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found.',
        });
      }

      // Avoid duplicate notifications when status has not changed.
      if (shipment.status === status) {
        return res.json({
          success: true,
          message: 'Shipment already has this status.',
          shipment,
          notificationCreated: false,
        });
      }

      const notificationDetails = {
        PENDING: {
          title: 'Shipment Pending',
          message: 'Your shipment is currently pending confirmation.',
          type: 'BOOKING',
        },
        CONFIRMED: {
          title: 'Booking Confirmed',
          message: 'Your shipment booking has been confirmed successfully.',
          type: 'BOOKING',
        },
        PICKED_UP: {
          title: 'Parcel Picked Up',
          message: 'Your parcel has been picked up and is on its way to the next facility.',
          type: 'PICKUP',
        },
        IN_TRANSIT: {
          title: 'Shipment In Transit',
          message: 'Your shipment is moving through our delivery network.',
          type: 'TRANSIT',
        },
        OUT_FOR_DELIVERY: {
          title: 'Out for Delivery',
          message: 'Your parcel is out for delivery. Please keep your phone available.',
          type: 'DELIVERY',
        },
        DELIVERED: {
          title: 'Shipment Delivered',
          message: 'Your parcel has been marked as delivered successfully.',
          type: 'DELIVERED',
        },
        CANCELLED: {
          title: 'Shipment Cancelled',
          message: 'Your shipment has been cancelled. Please contact ShipNext support if you need assistance.',
          type: 'SHIPMENT',
        },
        RTO: {
          title: 'Shipment Return Initiated',
          message: 'Your shipment is being returned to the sender.',
          type: 'SHIPMENT',
        },
      };

      const details = notificationDetails[status];

      const [updatedShipment, notification] = await prisma.$transaction([
        prisma.shipment.update({
          where: { id: shipment.id },
          data: { status },
        }),

        prisma.notification.create({
          data: {
            userId: shipment.customerId,
            title: details.title,
            message: details.message,
            type: details.type,
            trackingId: shipment.trackingId,
          },
        }),
      ]);

      return res.json({
        success: true,
        message: 'Shipment status updated and customer notification created.',
        shipment: updatedShipment,
        notificationCreated: true,
      });
    } catch (error) {
      console.error('Update shipment status error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to update shipment status.',
      });
    }
  }
);


module.exports = router;
