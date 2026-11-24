
const express = require('express');
const prisma = require('../prisma');
const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, authorizeRole('ADMIN'));

function getDateFilter(query) {
  const filter = {};

  if (query.from) {
    const from = new Date(`${query.from}T00:00:00.000Z`);

    if (Number.isNaN(from.getTime())) {
      throw new Error('INVALID_FROM_DATE');
    }

    filter.gte = from;
  }

  if (query.to) {
    const to = new Date(`${query.to}T23:59:59.999Z`);

    if (Number.isNaN(to.getTime())) {
      throw new Error('INVALID_TO_DATE');
    }

    filter.lte = to;
  }

  return Object.keys(filter).length ? filter : undefined;
}

// SEARCH CUSTOMERS
router.get('/customers', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();

    const customers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
                {
                  companyName: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        phone: true,
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
    console.error('Admin customer analytics search error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to search customers.',
    });
  }
});

// CUSTOMER DELIVERY ANALYTICS AND COMPLETE HISTORY
router.get('/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const createdAt = getDateFilter(req.query);

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
        ...(createdAt ? { createdAt } : {}),
      },
      include: {
        ndrRecords: {
          orderBy: {
            reportedAt: 'desc',
          },
        },
        childAccount: {
          select: {
            id: true,
            accountName: true,
            branchName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const shipmentIds = shipments.map((shipment) => shipment.id);

    const pinCodes = [
      ...new Set(
        shipments.flatMap((shipment) => [
          shipment.pickupPincode,
          shipment.deliveryPincode,
        ])
      ),
    ];

    const locationRecords = pinCodes.length
      ? await prisma.courierPincodeServiceability.findMany({
          where: {
            pincode: {
              in: pinCodes,
            },
          },
          select: {
            pincode: true,
            stateCode: true,
            district: true,
          },
        })
      : [];

    const locationMap = new Map();

    for (const record of locationRecords) {
      if (!locationMap.has(record.pincode)) {
        locationMap.set(record.pincode, {
          stateCode: record.stateCode,
          district: record.district,
        });
      }
    }

    const counts = {
      manifested: shipments.length,
      picked: 0,
      inTransit: 0,
      outForDelivery: 0,
      delivered: 0,
      rto: 0,
      cancelled: 0,
      ndrShipments: 0,
      ndrRecords: 0,
      totalDeliveryAttempts: 0,
      codShipments: 0,
      codCollected: 0,
      codRemitted: 0,
      codSettled: 0,
      totalShippingCharges: 0,
    };

    const stateBreakdown = new Map();
    const ndrShipmentIds = new Set();

    for (const shipment of shipments) {
      const status = shipment.status;

      if (
        ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RTO']
          .includes(status)
      ) {
        counts.picked += 1;
      }

      if (status === 'IN_TRANSIT') counts.inTransit += 1;
      if (status === 'OUT_FOR_DELIVERY') counts.outForDelivery += 1;
      if (status === 'DELIVERED') counts.delivered += 1;
      if (status === 'RTO') counts.rto += 1;
      if (status === 'CANCELLED') counts.cancelled += 1;

      counts.totalShippingCharges += Number(shipment.shippingCharge || 0);

      if (shipment.recipientPaymentMode === 'COD') {
        counts.codShipments += 1;

        if (shipment.codCollectedAt) {
          counts.codCollected += Number(shipment.codAmount || 0);
        }

        if (shipment.codRemittedAt) {
          counts.codRemitted += Number(shipment.codAmount || 0);
        }

        if (shipment.codSettledAt) {
          counts.codSettled += Number(shipment.codNetAmount || 0);
        }
      }

      counts.ndrRecords += shipment.ndrRecords.length;
      counts.totalDeliveryAttempts += shipment.ndrRecords.length;
      if (shipment.ndrRecords.length > 0) {
        ndrShipmentIds.add(shipment.id);
      }

      const location = locationMap.get(shipment.deliveryPincode);
      const state = location?.stateCode || 'Unknown';
      const district = location?.district || 'Unknown';

      if (!stateBreakdown.has(state)) {
        stateBreakdown.set(state, {
          stateCode: state,
          manifested: 0,
          picked: 0,
          delivered: 0,
          rto: 0,
          ndr: 0,
          cities: new Map(),
        });
      }

      const stateData = stateBreakdown.get(state);

      stateData.manifested += 1;

      if (
        ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RTO']
          .includes(status)
      ) {
        stateData.picked += 1;
      }

      if (status === 'DELIVERED') stateData.delivered += 1;
      if (status === 'RTO') stateData.rto += 1;
      if (shipment.ndrRecords.length > 0) stateData.ndr += 1;

      if (!stateData.cities.has(district)) {
        stateData.cities.set(district, {
          city: district,
          manifested: 0,
          picked: 0,
          delivered: 0,
          rto: 0,
          ndr: 0,
        });
      }

      const cityData = stateData.cities.get(district);

      cityData.manifested += 1;

      if (
        ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RTO']
          .includes(status)
      ) {
        cityData.picked += 1;
      }

      if (status === 'DELIVERED') cityData.delivered += 1;
      if (status === 'RTO') cityData.rto += 1;
      if (shipment.ndrRecords.length > 0) cityData.ndr += 1;
    }

    counts.ndrShipments = ndrShipmentIds.size;
    counts.totalShippingCharges = Number(
      counts.totalShippingCharges.toFixed(2)
    );

    const formattedStates = Array.from(stateBreakdown.values())
      .map((state) => ({
        ...state,
        cities: Array.from(state.cities.values()),
      }))
      .sort((a, b) => b.manifested - a.manifested);

    const history = shipments.map((shipment) => ({
      ...shipment,
      shippingCharge: shipment.shippingCharge.toString(),
      codAmount: shipment.codAmount?.toString() ?? null,
      codCharge: shipment.codCharge?.toString() ?? null,
      codNetAmount: shipment.codNetAmount?.toString() ?? null,
    }));

    return res.json({
      success: true,
      customer,
      summary: {
        ...counts,
        deliveredPercentage: counts.manifested
          ? Number(
              (counts.delivered / counts.manifested * 100).toFixed(2)
            )
          : 0,
        onTimeDeliveryPercentage: null,
        onTimeDeliveryMessage:
          'Unavailable until actual pickup and delivery timestamps are recorded.',
      },
      stateBreakdown: formattedStates,
      shipments: history,
    });
  } catch (error) {
    console.error('Customer delivery analytics error:', error);

    if (
      error.message === 'INVALID_FROM_DATE' ||
      error.message === 'INVALID_TO_DATE'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date filter.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Unable to load customer delivery analytics.',
    });
  }
});

module.exports = router;
