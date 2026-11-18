
const express = require('express');
const prisma = require('../prisma');
const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, authorizeRole('ADMIN'));

function getDateRange(period, startDate, endDate) {
  const now = new Date();
  let start;
  let end = new Date(now);

  if (period === 'custom') {
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required.');
    }

    start = new Date(`${startDate}T00:00:00.000Z`);
    end = new Date(`${endDate}T23:59:59.999Z`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      start > end
    ) {
      throw new Error('Invalid date range.');
    }
  } else if (period === 'weekly') {
    start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 7);
  } else if (period === 'monthly') {
    start = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      1
    ));
  } else if (period === 'yearly') {
    start = new Date(Date.UTC(
      now.getUTCFullYear(),
      0,
      1
    ));
  } else {
    throw new Error('Invalid report period.');
  }

  return { gte: start, lte: end };
}

// GET /api/admin/reports
// Example: /api/admin/reports?type=wallet&period=monthly
router.get('/', async (req, res) => {
  try {
    const { type, period = 'monthly', startDate, endDate } = req.query;

    const dateRange = getDateRange(period, startDate, endDate);

    let data;

    switch (type) {
      case 'wallet': {
        data = await prisma.wallet.findMany({
          where: {
            createdAt: dateRange,
          },
          select: {
            id: true,
            balance: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
        });
        break;
      }

      case 'revenue': {
        const shipments = await prisma.shipment.findMany({
          where: {
            createdAt: dateRange,
          },
          select: {
            id: true,
            trackingId: true,
            docketNumber: true,
            shippingCharge: true,
            paymentMode: true,
            status: true,
            createdAt: true,
            customer: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        const bookedShippingValue = shipments.reduce(
          (total, shipment) =>
            total + Number(shipment.shippingCharge),
          0
        );

        data = {
          totalShipments: shipments.length,
          bookedShippingValue,
          note: 'Booked shipping charges, not verified collected revenue.',
          records: shipments,
        };
        break;
      }

      case 'onboarding': {
        data = await prisma.user.findMany({
          where: {
            role: 'CUSTOMER',
            createdAt: dateRange,
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        break;
      }

      case 'shipments': {
        data = await prisma.shipment.findMany({
          where: {
            createdAt: dateRange,
          },
          select: {
            id: true,
            trackingId: true,
            docketNumber: true,
            status: true,
            shippingMode: true,
            weightGrams: true,
            shippingCharge: true,
            pickupPincode: true,
            deliveryPincode: true,
            createdAt: true,
            customer: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        break;
      }

      case 'ledger': {
        data = await prisma.walletTransaction.findMany({
          where: {
            createdAt: dateRange,
          },
          select: {
            id: true,
            type: true,
            amount: true,
            description: true,
            reference: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        break;
      }

      case 'outstanding':
        return res.status(501).json({
          success: false,
          message: 'Outstanding reports require payment and due records.',
        });

      case 'invoices':
        return res.status(501).json({
          success: false,
          message: 'Invoice reports require an invoice database model.',
        });

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type.',
        });
    }

    res.json({
      success: true,
      type,
      period,
      dateRange,
      data,
    });
  } catch (error) {
    console.error('Reports API error:', error);

    res.status(400).json({
      success: false,
      message: error.message || 'Unable to generate report.',
    });
  }
});

module.exports = router;
