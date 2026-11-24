
const express = require('express');
const prisma = require('../prisma');

const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

const {
  calculateShippingCharge,
} = require('../utils/shippingPricing');

const {
  getShippingZone,
} = require('../utils/shippingZone');

const router = express.Router();

const VALID_MODES = [
  'EXPRESS_AIR',
  'NORMAL_AIR',
  'EXPRESS_SURFACE',
  'NORMAL_SURFACE',
];

const COURIERS = [
  'DELHIVERY',
  'SKYKING',
  'BLUEDART',
];

function validPincode(pin) {
  return /^\d{6}$/.test(String(pin || '').trim());
}
async function getBlockedPincodes(pincodes) {
  const blocked = await prisma.blockedPincode.findMany({
    where: {
      pincode: { in: pincodes },
    },
    select: {
      pincode: true,
      reason: true,
    },
  });

  return new Map(
    blocked.map((item) => [item.pincode, item])
  );
}
function getSkykingStatus(record) {
  return record?.serviceabilityStatus || 'Serviceable';
}

function isCourierPinUsable(record, courier) {
  if (!record) return false;

  if (courier === 'SKYKING') {
    return getSkykingStatus(record) !== 'No Service';
  }

  return true;
}

function isPartiallyServiceable(record, courier) {
  return courier === 'SKYKING' &&
    getSkykingStatus(record) === 'Partially Serviceable';
}
// PUBLIC: Check PIN-code availability for all courier partners
router.post('/couriers/check', async (req, res) => {
  try {
    const pickupPincode = String(req.body.pickupPincode || '').trim();
    const deliveryPincode = String(req.body.deliveryPincode || '').trim();

    if (
      !validPincode(pickupPincode) ||
      !validPincode(deliveryPincode)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Enter valid six-digit pickup and delivery PIN codes.',
      });
    }
  const blockedPincodes = await getBlockedPincodes([
  pickupPincode,
  deliveryPincode,
]);

if (blockedPincodes.size > 0) {
  return res.json({
    success: true,
    blocked: true,
    serviceable: false,
    pickupPincode,
    deliveryPincode,
    blockedPincodes: Array.from(blockedPincodes.values()),
    courierResults: [],
    message: 'Service is unavailable for one or more entered PIN codes.',
  });
}
    const records = await prisma.courierPincodeServiceability.findMany({
      
      where: {
        courier: { in: COURIERS },
        pincode: { in: [pickupPincode, deliveryPincode] },
      },
    });

    const recordMap = new Map(
      records.map((record) => [
        `${record.courier}:${record.pincode}`,
        record,
      ])
    );
      const courierResults = COURIERS.map((courier) => {
  const pickup = recordMap.get(`${courier}:${pickupPincode}`);
  const delivery = recordMap.get(`${courier}:${deliveryPincode}`);

  const pickupUsable = isCourierPinUsable(pickup, courier);
  const deliveryUsable = isCourierPinUsable(delivery, courier);

  return {
    courier,
    serviceable: pickupUsable && deliveryUsable,

    partiallyServiceable:
      isPartiallyServiceable(pickup, courier) ||
      isPartiallyServiceable(delivery, courier),

    pickup: pickup
      ? {
          available: pickupUsable,
          serviceabilityStatus:
            courier === 'SKYKING' ? getSkykingStatus(pickup) : null,
          district: pickup.district,
          stateCode: pickup.stateCode,
          prepaid: pickup.prepaid,
          reversePickup: pickup.reversePickup,
          repl: pickup.repl,
          cod: pickup.cod,
          cash: pickup.cash,
        }
      : { available: false },

    delivery: delivery
      ? {
          available: deliveryUsable,
          serviceabilityStatus:
            courier === 'SKYKING' ? getSkykingStatus(delivery) : null,
          district: delivery.district,
          stateCode: delivery.stateCode,
          prepaid: delivery.prepaid,
          reversePickup: delivery.reversePickup,
          repl: delivery.repl,
          cod: delivery.cod,
          cash: delivery.cash,
        }
      : { available: false },
  };
});

    return res.json({
      success: true,
      pickupPincode,
      deliveryPincode,
      courierResults,
      message: 'Courier PIN-code availability checked successfully.',
    });
  } catch (error) {
    console.error('Courier PIN-code check error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to check courier PIN-code availability.',
    });
  }
});

// PUBLIC: Check serviceability and available shipping modes
router.post('/check', async (req, res) => {
  try {
    const pickupPincode = String(req.body.pickupPincode || '').trim();
    const deliveryPincode = String(req.body.deliveryPincode || '').trim();

    if (
      !validPincode(pickupPincode) ||
      !validPincode(deliveryPincode)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Enter valid six-digit pickup and delivery PIN codes.',
      });
    }

    const records = await prisma.courierPincodeServiceability.findMany({
      where: {
        courier: { in: COURIERS },
        pincode: { in: [pickupPincode, deliveryPincode] },
      },
    });

    // A courier must cover BOTH pickup and delivery PIN codes.
   // A courier must cover BOTH pickup and delivery PIN codes.
const serviceableCouriers = COURIERS.filter((courier) => {
  const pickup = records.find(
    (record) =>
      record.courier === courier &&
      record.pincode === pickupPincode
  );

  const delivery = records.find(
    (record) =>
      record.courier === courier &&
      record.pincode === deliveryPincode
  );

  return (
    isCourierPinUsable(pickup, courier) &&
    isCourierPinUsable(delivery, courier)
  );
});

const partiallyServiceableCouriers = serviceableCouriers.filter(
  (courier) => {
    const pickup = records.find(
      (record) =>
        record.courier === courier &&
        record.pincode === pickupPincode
    );

    const delivery = records.find(
      (record) =>
        record.courier === courier &&
        record.pincode === deliveryPincode
    );

    return (
      isPartiallyServiceable(pickup, courier) ||
      isPartiallyServiceable(delivery, courier)
    );
  }
);
    // TEMPORARY: The imported dataset does not identify Air/Surface modes.
    const availableModes = VALID_MODES.map((mode, index) => ({
      mode,
      priority: index + 1,
    }));

    return res.json({
      success: true,
      serviceable: true,
      assignedMode: availableModes[0].mode,
      availableModes,
      message: 'Shipping options retrieved using courier PIN coverage.',
      availabilityBasis: 'COURIER_PIN_COVERAGE',
      provisionalModes: true,
      serviceableCouriers,
partiallyServiceableCouriers,
    });
  } catch (error) {
    console.error('Serviceability check error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to check serviceability.',
    });
  }
});

// PUBLIC: Calculate shipping charge after mode selection
router.post('/quote', async (req, res) => {
  try {
    const pickupPincode = String(req.body.pickupPincode || '').trim();
    const deliveryPincode = String(req.body.deliveryPincode || '').trim();
    const { weight, mode } = req.body;

    if (
      !validPincode(pickupPincode) ||
      !validPincode(deliveryPincode)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Enter valid six-digit PIN codes.',
      });
    }

    if (!VALID_MODES.includes(mode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shipping mode.',
      });
    }

    if (!Number.isFinite(Number(weight)) || Number(weight) < 0.5) {
      return res.status(400).json({
        success: false,
        message: 'Minimum shipment weight is 500 grams.',
      });
    }

    const locationRecords =
      await prisma.courierPincodeServiceability.findMany({
        where: {
          courier: { in: COURIERS },
          pincode: { in: [pickupPincode, deliveryPincode] },
        },
      });

   // Find one courier that can serve both locations.
const selectedCourier = COURIERS.find((courier) => {
  const pickup = locationRecords.find(
    (item) =>
      item.courier === courier &&
      item.pincode === pickupPincode
  );

  const delivery = locationRecords.find(
    (item) =>
      item.courier === courier &&
      item.pincode === deliveryPincode
  );

  return (
    isCourierPinUsable(pickup, courier) &&
    isCourierPinUsable(delivery, courier)
  );
});

    if (!selectedCourier) {
      return res.status(404).json({
        success: false,
        message: 'No courier covers both PIN codes.',
      });
    }

    const pickup = locationRecords.find(
      (item) =>
        item.courier === selectedCourier &&
        item.pincode === pickupPincode
    );

    const delivery = locationRecords.find(
      (item) =>
        item.courier === selectedCourier &&
        item.pincode === deliveryPincode
    );

    const zone = getShippingZone(pickup, delivery);

    const pricingMode = mode.endsWith('_AIR')
      ? 'AIR'
      : 'SURFACE';

    const charge = calculateShippingCharge(
      zone,
      pricingMode,
      weight
    );

    return res.json({
      success: true,
      mode,
      ...charge,
      message: 'Shipping charge calculated successfully.',
      provisionalModeAvailability: true,
    });
  } catch (error) {
    console.error('Shipping quote error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to calculate shipping charge.',
    });
  }
});

// ADMIN: Compare all available courier partners and shipping modes
router.post(
  '/admin/rate-comparison',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const pickupPincode = String(req.body.pickupPincode || '').trim();
      const deliveryPincode = String(req.body.deliveryPincode || '').trim();
      const weight = Number(req.body.weight);

      if (
        !validPincode(pickupPincode) ||
        !validPincode(deliveryPincode)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Enter valid six-digit PIN codes.',
        });
      }

      if (!Number.isFinite(weight) || weight < 0.5) {
        return res.status(400).json({
          success: false,
          message: 'Minimum shipment weight is 500 grams.',
        });
      }

      const blocked = await getBlockedPincodes([
        pickupPincode,
        deliveryPincode,
      ]);

      if (blocked.size > 0) {
        return res.status(403).json({
          success: false,
          message: 'One or both PIN codes are blocked.',
          blockedPincodes: Array.from(blocked.values()),
        });
      }

      const records = await prisma.courierPincodeServiceability.findMany({
        where: {
          courier: { in: COURIERS },
          pincode: { in: [pickupPincode, deliveryPincode] },
        },
      });

      const results = [];

      for (const courier of COURIERS) {
        const pickup = records.find(
          (r) => r.courier === courier && r.pincode === pickupPincode
        );

        const delivery = records.find(
          (r) => r.courier === courier && r.pincode === deliveryPincode
        );

        if (
          !isCourierPinUsable(pickup, courier) ||
          !isCourierPinUsable(delivery, courier)
        ) {
          continue;
        }

        const zone = getShippingZone(pickup, delivery);

        for (const mode of VALID_MODES) {
          const pricingMode = mode.endsWith('_AIR') ? 'AIR' : 'SURFACE';

          const charge = calculateShippingCharge(
            zone,
            pricingMode,
            weight
          );

          results.push({
            courier,
            mode,
            ...charge,
          });
        }
      }

      results.sort((a, b) => a.total - b.total);

      return res.json({
        success: true,
        pickupPincode,
        deliveryPincode,
        weight,
        results,
        count: results.length,
        message: results.length
          ? 'Rate comparison completed.'
          : 'No courier partner serves both PIN codes.',
      });
    } catch (error) {
      console.error('Admin rate comparison error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to compare shipping rates.',
      });
    }
  }
);


// ADMIN: View all configured routes
router.get(
  '/admin/routes',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const routes = await prisma.serviceabilityMode.findMany({
        orderBy: [
          { pickupPincode: 'asc' },
          { deliveryPincode: 'asc' },
          { priority: 'asc' },
        ],
      });

      return res.json({ success: true, routes });
    } catch (error) {
      console.error('Fetch serviceability routes error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to fetch serviceability routes.',
      });
    }
  }
);

// ADMIN: Add one shipping mode to a PIN-to-PIN route
router.post(
  '/admin/routes',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const {
        pickupPincode,
        deliveryPincode,
        mode,
        priority = 1,
        isActive = true,
      } = req.body;

      if (
        !validPincode(pickupPincode) ||
        !validPincode(deliveryPincode)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Both PIN codes must contain six digits.',
        });
      }

      if (!VALID_MODES.includes(mode)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid shipping mode.',
        });
      }

      if (
        !Number.isInteger(priority) ||
        priority < 1 ||
        typeof isActive !== 'boolean'
      ) {
        return res.status(400).json({
          success: false,
          message: 'Priority must be a positive integer and isActive must be boolean.',
        });
      }

      const route = await prisma.serviceabilityMode.create({
        data: {
          pickupPincode,
          deliveryPincode,
          mode,
          priority,
          isActive,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Shipping mode added to route.',
        route,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'This shipping mode is already configured for this route.',
        });
      }

      console.error('Create serviceability route error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to add shipping mode.',
      });
    }
  }
);

// ADMIN: Update priority or activate/deactivate a mode
router.patch(
  '/admin/routes/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      const { priority, isActive } = req.body;

      if (
        priority === undefined &&
        isActive === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: 'Provide priority or isActive to update.',
        });
      }

      if (
        priority !== undefined &&
        (!Number.isInteger(priority) || priority < 1)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Priority must be a positive integer.',
        });
      }

      if (
        isActive !== undefined &&
        typeof isActive !== 'boolean'
      ) {
        return res.status(400).json({
          success: false,
          message: 'isActive must be true or false.',
        });
      }

      const route = await prisma.serviceabilityMode.update({
        where: { id: req.params.id },
        data: {
          ...(priority !== undefined && { priority }),
          ...(isActive !== undefined && { isActive }),
        },
      });

      return res.json({
        success: true,
        message: 'Serviceability route updated.',
        route,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Serviceability route not found.',
        });
      }

      console.error('Update serviceability route error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to update route.',
      });
    }
  }
);

// ADMIN: Delete a configured mode
router.delete(
  '/admin/routes/:id',
  authenticateToken,
  authorizeRole('ADMIN'),
  async (req, res) => {
    try {
      await prisma.serviceabilityMode.delete({
        where: { id: req.params.id },
      });

      return res.json({
        success: true,
        message: 'Shipping mode removed from route.',
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: 'Serviceability route not found.',
        });
      }

      console.error('Delete serviceability route error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to delete route.',
      });
    }
  }
);

module.exports = router;
