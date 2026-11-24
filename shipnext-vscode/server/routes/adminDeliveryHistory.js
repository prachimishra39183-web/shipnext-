
const express = require('express');
const prisma = require('../prisma');
const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

const router = express.Router();

// ADMIN: SEARCH CUSTOMERS
router.get(
  '/customers',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const search = String(req.query.search || '').trim();

      const customers = await prisma.user.findMany({
        where: {
          role: 'CUSTOMER',
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                  { companyName: { contains: search, mode: 'insensitive' } },
                  { phone: { contains: search } },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          companyName: true,
          createdAt: true,
          _count: {
            select: {
              shipments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });

      return res.json({
        success: true,
        customers,
      });
    } catch (error) {
      console.error('Admin customer search error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve customers.',
      });
    }
  }
);

// ADMIN: GET ONE CUSTOMER'S COMPLETE DELIVERY HISTORY
router.get(
  '/customers/:customerId/delivery-history',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const { customerId } = req.params;

      const customer = await prisma.user.findFirst({
        where: {
          id: customerId,
          role: 'CUSTOMER',
        },
        select: {
  id: true,
  name: true,
  email: true,
  phone: true,
  companyName: true,
  isActive: true,
  createdAt: true,
},
        
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found.',
        });
      }

      const shipments = await prisma.shipment.findMany({
        where: {
          customerId,
        },
        include: {
          ndrRecords: {
            orderBy: {
              reportedAt: 'desc',
            },
          },
          invoice: true,
          draft: {
            select: {
              shipmentType: true,
              itemCategory: true,
              itemName: true,
              itemDescription: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const summary = {
        totalShipments: shipments.length,
        delivered: 0,
        inTransit: 0,
        pending: 0,
        cancelled: 0,
        rto: 0,
        totalShippingCharges: 0,
        totalCodAmount: 0,
        totalNdrAttempts: 0,
      };

      shipments.forEach((shipment) => {
        if (shipment.status === 'DELIVERED') summary.delivered++;
        else if (
          ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(
            shipment.status
          )
        ) summary.inTransit++;
        else if (shipment.status === 'CANCELLED') summary.cancelled++;
        else if (shipment.status === 'RTO') summary.rto++;
        else summary.pending++;

        summary.totalShippingCharges += Number(shipment.shippingCharge || 0);
        summary.totalCodAmount += Number(shipment.codAmount || 0);
        summary.totalNdrAttempts += shipment.ndrRecords.length;
      });

      summary.totalShippingCharges = Number(
        summary.totalShippingCharges.toFixed(2)
      );
      summary.totalCodAmount = Number(
        summary.totalCodAmount.toFixed(2)
      );

      return res.json({
        success: true,
        customer,
        summary,
        shipments,
      });
    } catch (error) {
      console.error('Admin delivery history error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve customer delivery history.',
      });
    }
  }
);

module.exports = router;
