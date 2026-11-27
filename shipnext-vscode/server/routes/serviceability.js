
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
const {
  checkServiceability: checkShadowfaxServiceability,
} = require('../integrations/shadowfax');
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
async function getPincodeLocations(pincodes) {
  const records = await prisma.courierPincodeServiceability.findMany({
    where: {
      pincode: { in: pincodes },
    },
    select: {
      pincode: true,
      district: true,
      stateCode: true,
    },
  });

  const locationMap = new Map();

  records.forEach((record) => {
    if (!locationMap.has(record.pincode)) {
      locationMap.set(record.pincode, {
        pincode: record.pincode,
        district: record.district,
        stateCode: record.stateCode,
      });
    }
  });

  return {
    pickupLocation: locationMap.get(pincodes[0]) || null,
    deliveryLocation: locationMap.get(pincodes[1]) || null,
  };
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
   const { pickupLocation, deliveryLocation } =
  await getPincodeLocations([pickupPincode, deliveryPincode]);

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
    pickupLocation,
deliveryLocation,
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

// Add live Shadowfax result
try {
  const [pickupResponse, returnResponse, deliveryResponse] =
    await Promise.all([
      checkShadowfaxServiceability(pickupPincode, 'seller_pickup'),
      checkShadowfaxServiceability(pickupPincode, 'seller_delivery'),
      checkShadowfaxServiceability(deliveryPincode, 'customer_delivery'),
    ]);

  const hasTier = (response, pin, tier) => {
    if (!Array.isArray(response)) return false;

    const result = response.find(
      item => String(item.code) === String(pin)
    );

    return result?.services?.includes(tier) || false;
  };

  const regularPickup = hasTier(
    pickupResponse, pickupPincode, 'Marketplace'
  );
  const regularReturn = hasTier(
    returnResponse, pickupPincode, 'RTS'
  );
  const regularDelivery = hasTier(
    deliveryResponse, deliveryPincode, 'Regular'
  );

  const surfacePickup = hasTier(
    pickupResponse, pickupPincode, 'Surface_Mkt'
  );
  const surfaceReturn = hasTier(
    returnResponse, pickupPincode, 'Surface_RTS'
  );
  const surfaceDelivery = hasTier(
    deliveryResponse, deliveryPincode, 'Surface'
  );

  const availableModes = [];

  if (regularPickup && regularReturn && regularDelivery) {
    availableModes.push('REGULAR');
  }

  if (surfacePickup && surfaceReturn && surfaceDelivery) {
    availableModes.push('SURFACE');
  }

  const pickupAvailable = regularPickup || surfacePickup;
  const returnAvailable = regularReturn || surfaceReturn;
  const deliveryAvailable = regularDelivery || surfaceDelivery;

  courierResults.push({
    courier: 'SHADOWFAX',
    serviceable: availableModes.length > 0,
    partiallyServiceable:
      pickupAvailable || returnAvailable || deliveryAvailable,

    pickup: {
      available: pickupAvailable,
      regular: regularPickup,
      surface: surfacePickup,
    },

    sellerReturn: {
      available: returnAvailable,
      regular: regularReturn,
      surface: surfaceReturn,
    },

    delivery: {
      available: deliveryAvailable,
      regular: regularDelivery,
      surface: surfaceDelivery,
    },

    availableModes,
    checkStatus: 'COMPLETED',
  });

} catch (error) {
  console.error('Shadowfax serviceability error:', error.message);

  courierResults.push({
    courier: 'SHADOWFAX',
    serviceable: false,
    partiallyServiceable: false,
    pickup: { available: false },
    sellerReturn: { available: false },
    delivery: { available: false },
    availableModes: [],
    checkStatus: 'UNAVAILABLE',
  });
}
return res.json({
  success: true,
  pickupPincode,
  deliveryPincode,
  courierResults,
  pickupLocation,
deliveryLocation,
  message: 'Courier PIN-code check completed.',
});
  } catch (error) {
    console.error('Courier PIN-code check error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to check courier PIN-code availability.',
    });
  }
});

// PUBLIC: Check serviceability and available modes for all couriers
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
     const { pickupLocation, deliveryLocation } =
  await getPincodeLocations([pickupPincode, deliveryPincode]);
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
        pickupLocation,
deliveryLocation,
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

    const courierResults = COURIERS.map((courier) => {
      const pickup = records.find(
        item => item.courier === courier && item.pincode === pickupPincode
      );

      const delivery = records.find(
        item => item.courier === courier && item.pincode === deliveryPincode
      );

      const pickupAvailable = isCourierPinUsable(pickup, courier);
      const deliveryAvailable = isCourierPinUsable(delivery, courier);

     const surfaceServiceable = pickupAvailable && deliveryAvailable;

// Air shipments are Skyking-only.
// Skyking must have First Mile pickup and Last Mile delivery.
const airServiceable =
  courier === 'SKYKING' &&
  surfaceServiceable &&
  pickup?.firstMile === true &&
  delivery?.lastMile === true;

const availableModes = [];

if (airServiceable) {
  availableModes.push('EXPRESS_AIR', 'NORMAL_AIR');
}

if (surfaceServiceable) {
  availableModes.push('EXPRESS_SURFACE', 'NORMAL_SURFACE');
}

      return {
        courier,
        serviceable: availableModes.length > 0,
        availableModes,
        pickup: {
          available: pickupAvailable,
          firstMile: pickup?.firstMile ?? null,
        },
        delivery: {
          available: deliveryAvailable,
          lastMile: delivery?.lastMile ?? null,
        },
      };
    });

    // Check Shadowfax live serviceability
    try {
      const [pickupResponse, returnResponse, deliveryResponse] =
        await Promise.all([
          checkShadowfaxServiceability(pickupPincode, 'seller_pickup'),
          checkShadowfaxServiceability(pickupPincode, 'seller_delivery'),
          checkShadowfaxServiceability(deliveryPincode, 'customer_delivery'),
        ]);

      const hasTier = (response, pin, tier) => {
        if (!Array.isArray(response)) return false;

        const result = response.find(
          item => String(item.code) === String(pin)
        );

        return result?.services?.includes(tier) || false;
      };

      const regularAvailable =
        hasTier(pickupResponse, pickupPincode, 'Marketplace') &&
        hasTier(returnResponse, pickupPincode, 'RTS') &&
        hasTier(deliveryResponse, deliveryPincode, 'Regular');

      const surfaceAvailable =
        hasTier(pickupResponse, pickupPincode, 'Surface_Mkt') &&
        hasTier(returnResponse, pickupPincode, 'Surface_RTS') &&
        hasTier(deliveryResponse, deliveryPincode, 'Surface');

      // Shadowfax API exposes Regular and Surface tiers.
      // Do not label these as Air modes without carrier confirmation.
      const shadowfaxModes = [];

      if (regularAvailable) {
        shadowfaxModes.push('NORMAL_SURFACE');
      }

      if (surfaceAvailable) {
        shadowfaxModes.push('EXPRESS_SURFACE');
      }
         console.log('SHADOWFAX MODE DEBUG:', {
  regularAvailable,
  surfaceAvailable,
  shadowfaxModes,
});
      courierResults.push({
        courier: 'SHADOWFAX',
        serviceable: shadowfaxModes.length > 0,
        availableModes: shadowfaxModes,
        pickup: {
          available: regularAvailable || surfaceAvailable,
        },
        delivery: {
          available: regularAvailable || surfaceAvailable,
        },
        checkStatus: 'COMPLETED',
      });
    } catch (error) {
      console.error('Shadowfax serviceability error:', error.message);

      courierResults.push({
        courier: 'SHADOWFAX',
        serviceable: false,
        availableModes: [],
        pickup: { available: false },
        delivery: { available: false },
        checkStatus: 'UNAVAILABLE',
      });
    }

    const serviceableCouriers = courierResults.filter(
      item => item.serviceable
    );

    const availableModes = [
      ...new Set(courierResults.flatMap(item => item.availableModes)),
    ];

    return res.json({
      success: true,
      serviceable: serviceableCouriers.length > 0,
      pickupPincode,
      deliveryPincode,
      availableModes,
      courierResults,
      pickupLocation,
deliveryLocation,
      message: 'Courier serviceability check completed.',
    });
  } catch (error) {
    console.error('Serviceability check error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to check serviceability.',
    });
  }
});

// PUBLIC: Calculate shipping charge for the selected courier
router.post('/quote', async (req, res) => {
  try {
    const pickupPincode = String(req.body.pickupPincode || '').trim();
    const deliveryPincode = String(req.body.deliveryPincode || '').trim();
    const { weight, mode } = req.body;
    const courier = String(req.body.courier || '').toUpperCase();

    const allowedCouriers = [...COURIERS, 'SHADOWFAX'];

    if (!validPincode(pickupPincode) || !validPincode(deliveryPincode)) {
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

    if (!allowedCouriers.includes(courier)) {
      return res.status(400).json({
        success: false,
        message: 'Select a valid courier partner.',
      });
    }

    if (!Number.isFinite(Number(weight)) || Number(weight) < 0.5) {
      return res.status(400).json({
        success: false,
        message: 'Minimum shipment weight is 500 grams.',
      });
    }

    const blockedPincodes = await getBlockedPincodes([
      pickupPincode,
      deliveryPincode,
    ]);

    if (blockedPincodes.size > 0) {
      return res.status(400).json({
        success: false,
        message: 'Service is blocked for one or both PIN codes.',
        blockedPincodes: Array.from(blockedPincodes.values()),
      });
    }

    const isAirMode = mode.endsWith('_AIR');

    if (courier === 'SHADOWFAX' && isAirMode) {
      return res.status(400).json({
        success: false,
        message: 'Air service is not currently confirmed for Shadowfax.',
      });
    }

    const locationRecords = await prisma.courierPincodeServiceability.findMany({
      where: {
        courier: { in: COURIERS },
        pincode: { in: [pickupPincode, deliveryPincode] },
      },
    });

    let zonePickup;
    let zoneDelivery;

    if (courier === 'SHADOWFAX') {
      const [pickupResponse, returnResponse, deliveryResponse] =
        await Promise.all([
          checkShadowfaxServiceability(pickupPincode, 'seller_pickup'),
          checkShadowfaxServiceability(pickupPincode, 'seller_delivery'),
          checkShadowfaxServiceability(deliveryPincode, 'customer_delivery'),
        ]);

      const hasTier = (response, pin, tier) => {
        if (!Array.isArray(response)) return false;

        const result = response.find(
          item => String(item.code) === String(pin)
        );

        return result?.services?.includes(tier) || false;
      };

      const isRegular = mode === 'NORMAL_SURFACE';

      const pickupAvailable = hasTier(
        pickupResponse,
        pickupPincode,
        isRegular ? 'Marketplace' : 'Surface_Mkt'
      );

      const returnAvailable = hasTier(
        returnResponse,
        pickupPincode,
        isRegular ? 'RTS' : 'Surface_RTS'
      );

      const deliveryAvailable = hasTier(
        deliveryResponse,
        deliveryPincode,
        isRegular ? 'Regular' : 'Surface'
      );

      if (!pickupAvailable || !returnAvailable || !deliveryAvailable) {
        return res.status(404).json({
          success: false,
          message: `Shadowfax does not support ${mode} for this PIN combination.`,
        });
      }

      // Use the PIN location data to determine the ShipNext zone.
      const zoneCourier = COURIERS.find(name => {
        const pickup = locationRecords.find(
          item => item.courier === name && item.pincode === pickupPincode
        );
        const delivery = locationRecords.find(
          item => item.courier === name && item.pincode === deliveryPincode
        );

        return pickup && delivery;
      });

      if (!zoneCourier) {
        return res.status(404).json({
          success: false,
          message: 'Unable to determine the shipping zone for this route.',
        });
      }

      zonePickup = locationRecords.find(
        item => item.courier === zoneCourier && item.pincode === pickupPincode
      );

      zoneDelivery = locationRecords.find(
        item => item.courier === zoneCourier && item.pincode === deliveryPincode
      );
    } else {
      zonePickup = locationRecords.find(
        item => item.courier === courier && item.pincode === pickupPincode
      );

      zoneDelivery = locationRecords.find(
        item => item.courier === courier && item.pincode === deliveryPincode
      );

      if (
        !isCourierPinUsable(zonePickup, courier) ||
        !isCourierPinUsable(zoneDelivery, courier)
      ) {
        return res.status(404).json({
          success: false,
          message: `${courier} does not serve both PIN codes.`,
        });
      }

      if (
        courier === 'SKYKING' &&
        isAirMode &&
        (
          zonePickup?.firstMile !== true ||
          zoneDelivery?.lastMile !== true
        )
      ) {
        return res.status(404).json({
          success: false,
          message: 'Skyking Air requires First Mile pickup and Last Mile delivery serviceability.',
        });
      }
    }

    const zone = getShippingZone(zonePickup, zoneDelivery);

    const pricingMode = isAirMode ? 'AIR' : 'SURFACE';

    const charge = calculateShippingCharge(
      zone,
      pricingMode,
      Number(weight)
    );

    return res.json({
      success: true,
      courier,
      mode,
      ...charge,
      pricingBasis: 'SHIPNEXT_TARIFF',
      message: 'Shipping charge calculated successfully.',
    });
  } catch (error) {
    console.error('Shipping quote error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to calculate shipping charge.',
    });
  }
});

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
// Shadowfax live PIN serviceability check



module.exports = router;
