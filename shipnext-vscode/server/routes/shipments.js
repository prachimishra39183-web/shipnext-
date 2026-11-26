
const express = require('express');
const crypto = require('crypto');
const prisma = require('../prisma');
const {
  checkServiceability: checkShadowfaxServiceability,
  getAvailableServices,
  createShipment: createShadowfaxShipment,
  trackShipment: trackShadowfaxShipment,
} = require('../integrations/shadowfax');
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

const { getProcessingDate, generateDocketNumber } = require('../utils/shipmentUtils');
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
async function checkShadowfaxMode(pickupPincode, deliveryPincode, mode) {
  const isAir = mode.endsWith('_AIR');

  const checks = isAir
    ? [
        [pickupPincode, 'seller_pickup', 'Marketplace'],
        [pickupPincode, 'seller_delivery', 'RTS'],
        [deliveryPincode, 'customer_delivery', 'Regular'],
      ]
    : [
        [pickupPincode, 'seller_pickup', 'Surface_Mkt'],
        [pickupPincode, 'seller_delivery', 'Surface_RTS'],
        [deliveryPincode, 'customer_delivery', 'Surface'],
      ];

  for (const [pincode, service, requiredTier] of checks) {
    const response = await checkShadowfaxServiceability(pincode, service);
    const result = getAvailableServices(response, pincode);

    if (!result.services.includes(requiredTier)) {
      return false;
    }
  }

  return true;
}
function validPincode(pin) {
  return /^[0-9]{6}$/.test(String(pin || '').trim());
}

function generateTrackingId() {
  return `SN${Date.now()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}


async function generateInvoiceNumber(tx, {
  shipmentType,
  shippingMode,
  paymentMode,
}) {
  const payment = String(paymentMode || 'PREPAID').toUpperCase();

    let prefix;

  // Express Air Documents
  if (
    shipmentType === 'DOCUMENT' &&
    shippingMode === 'EXPRESS_AIR'
  ) {
    prefix = 'SNEA';
  } else {
    const prefixes = {
      EXPRESS_AIR: {
        PREPAID: 'SNEAP',
        COD: 'SNEAC',
      },
      NORMAL_AIR: {
        PREPAID: 'SNESP',
        COD: 'SNESC',
      },
      EXPRESS_SURFACE: {
        PREPAID: 'SNGEP',
        COD: 'SNGEC',
      },
      NORMAL_SURFACE: {
        PREPAID: 'SNGSP',
        COD: 'SNGSC',
      },
    };

    prefix = prefixes[shippingMode]?.[payment];

    if (!prefix) {
      throw new Error('Unable to determine invoice prefix.');
    }
  }

  // Financial year based on Indian Standard Time
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(new Date());

  const year = Number(parts.find(p => p.type === 'year').value);
  const month = Number(parts.find(p => p.type === 'month').value);

  const fyStart = month >= 4 ? year : year - 1;
  const financialYear = `${fyStart}-${String(fyStart + 1).slice(-2)}`;
  const yearCode = String(fyStart).slice(-2);

  const sequence = await tx.invoiceSequence.upsert({
    where: {
      prefix_financialYear: {
        prefix,
        financialYear,
      },
    },
    update: {
      lastNumber: { increment: 1 },
    },
    create: {
      prefix,
      financialYear,
      lastNumber: 1,
    },
  });

  return `${prefix}-${yearCode}-${String(sequence.lastNumber).padStart(6, '0')}`;
}

// SAVE SELECTED MODE AND CALCULATE INTERNAL SHIPNEXT RATE

router.post(
  '/drafts/:id/prepare-rates',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const { mode, courier } = req.body;
      const requestedCourier = String(courier || '').toUpperCase();
      const customerId = req.user.userId;

      if (!VALID_MODES.includes(mode)) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid shipping mode.',
        });
      }

      const isAirMode =
        mode === 'EXPRESS_AIR' || mode === 'NORMAL_AIR';

      if (isAirMode && requestedCourier !== 'SKYKING') {
        return res.status(400).json({
          success: false,
          message: 'Air shipments are available only through Skyking.',
        });
      }
      if (!isAirMode && requestedCourier === 'SKYKING') {
  return res.status(400).json({
    success: false,
    message: 'Skyking is not available for Surface shipments.',
  });
}

      if (
        !COURIERS.includes(requestedCourier) &&
        requestedCourier !== 'SHADOWFAX'
      ) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid delivery option.',
        });
      }

      const draft = await prisma.shipmentDraft.findFirst({
        where: {
          id: req.params.id,
          customerId,
        },
      });

      if (!draft) {
        return res.status(404).json({
          success: false,
          message: 'Shipment draft not found.',
        });
      }

      const pickupPincode = draft.pickupPincode;
      const deliveryPincode = draft.deliveryPincode;

      if (
        !validPincode(pickupPincode) ||
        !validPincode(deliveryPincode)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid shipment PIN codes.',
        });
      }

      if (requestedCourier === 'SHADOWFAX') {
        if (Number(draft.productValue) >= 50000) {
          return res.status(400).json({
            success: false,
            message: 'Shadowfax bookings of ₹50,000 or more require an e-way bill.',
          });
        }

        const serviceable = await checkShadowfaxMode(
          pickupPincode,
          deliveryPincode,
          mode
        );

        if (!serviceable) {
          return res.status(404).json({
            success: false,
            message: 'This delivery option is unavailable for the selected route.',
          });
        }
      }

      const locationRecords =
        await prisma.courierPincodeServiceability.findMany({
          where: {
            courier: { in: COURIERS },
            pincode: {
              in: [pickupPincode, deliveryPincode],
            },
          },
        });

      let zoneCourier = requestedCourier;

      if (requestedCourier === 'SHADOWFAX') {
        zoneCourier = COURIERS.find((partner) => {
          const hasPickup = locationRecords.some(
            (item) =>
              item.courier === partner &&
              item.pincode === pickupPincode
          );

          const hasDelivery = locationRecords.some(
            (item) =>
              item.courier === partner &&
              item.pincode === deliveryPincode
          );

          return hasPickup && hasDelivery;
        });

        if (!zoneCourier) {
          return res.status(404).json({
            success: false,
            message: 'Unable to determine the shipping zone for this route.',
          });
        }
      }

      const pickup = locationRecords.find(
        (item) =>
          item.courier === zoneCourier &&
          item.pincode === pickupPincode
      );

      const delivery = locationRecords.find(
        (item) =>
          item.courier === zoneCourier &&
          item.pincode === deliveryPincode
      );

      if (!pickup || !delivery) {
        return res.status(404).json({
          success: false,
          message: 'The selected delivery option does not cover both PIN codes.',
        });
      }

      if (
        isAirMode &&
        (
          pickup.firstMile !== true ||
          delivery.lastMile !== true
        )
      ) {
        return res.status(404).json({
          success: false,
          message: 'Skyking Air requires First Mile at pickup and Last Mile at delivery.',
        });
      }

      const weightKg = Number(draft.weightGrams) / 1000;

      if (!Number.isFinite(weightKg) || weightKg < 0.5) {
        return res.status(400).json({
          success: false,
          message: 'Minimum shipment weight is 500 grams.',
        });
      }

      const zone = getShippingZone(pickup, delivery);

      const pricingMode = mode.endsWith('_AIR')
        ? 'AIR'
        : 'SURFACE';

      const charge = calculateShippingCharge(
        zone,
        pricingMode,
        weightKg
      );
      console.log('SHIPNEXT RATE PREPARED:', {
  draftId: draft.id,
  pickupPincode,
  deliveryPincode,
  mode,
  weightKg,
  zone,
  pricingMode,
  total: charge.total,
});

      await prisma.shipmentDraft.update({
        where: { id: draft.id },
        data: {
          shippingMode: mode,

          // Internal rate: never return this amount to the customer.
          shipNextRate: charge.total,

          // Delhivery rates are cleared until correctly recalculated.
          delhiveryExpressRate: null,
          delhiveryStandardRate: null,

          // Changing mode requires fresh admin approval.
          rateApprovalStatus: 'PENDING',
          selectedRateOption: null,
          approvedShippingCharge: null,
          rateApprovedById: null,
          rateApprovedAt: null,
        },
      });

      return res.json({
        success: true,
        message: 'Shipping mode saved. Your shipment is awaiting rate approval.',
        rateApprovalStatus: 'PENDING',
        shippingMode: mode,
      });
    } catch (error) {
      console.error('Prepare shipment rates error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to prepare shipment rates.',
      });
    }
  }
);



// SAVE SHIPMENT DETAILS AS A DRAFT

router.post(
  '/drafts',
  authenticateToken,
  validateChildAccount,
  async (req, res) => {
    try {
      const {
        pickupName,
        pickupPhone,
        pickupAddress,
        pickupPincode,
        deliveryName,
        deliveryPhone,
        deliveryAddress,
        deliveryPincode,
        weight,
        shipmentType,
        itemCategory,
        itemName,
        itemDescription,
        paymentMode,
codAmount,

      } = req.body;

      const requiredFields = {
        pickupName,
        pickupPhone,
        pickupAddress,
        pickupPincode,
        deliveryName,
        deliveryPhone,
        deliveryAddress,
        deliveryPincode,
        weight,
        
      };

      for (const [field, value] of Object.entries(requiredFields)) {
        if (
          value === undefined ||
          value === null ||
          String(value).trim() === ''
        ) {
          return res.status(400).json({
            success: false,
            message: `${field} is required.`,
          });
        }
      }

      if (
        !/^[0-9]{10}$/.test(String(pickupPhone)) ||
        !/^[0-9]{10}$/.test(String(deliveryPhone))
      ) {
        return res.status(400).json({
          success: false,
          message: 'Both mobile numbers must contain 10 digits.',
        });
      }

      if (
        !validPincode(pickupPincode) ||
        !validPincode(deliveryPincode)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Both pincodes must contain 6 digits.',
        });
      }

      const weightKg = Number(weight);

      if (!Number.isFinite(weightKg) || weightKg < 0.5) {
        return res.status(400).json({
          success: false,
          message: 'Minimum parcel weight is 500 grams.',
        });
      }
     const normalizedPaymentMode = paymentMode || 'PREPAID';

if (!['PREPAID', 'COD'].includes(normalizedPaymentMode)) {
  return res.status(400).json({
    success: false,
    message: 'Please select a valid payment mode.',
  });
}

let normalizedCodAmount = null;

if (normalizedPaymentMode === 'COD') {
  const codAmountString = String(codAmount ?? '').trim();

  if (
    !/^\d+(\.\d{1,2})?$/.test(codAmountString) ||
    !Number.isFinite(Number(codAmountString)) ||
    Number(codAmountString) <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid COD amount greater than ₹0.',
    });
  }

  normalizedCodAmount = codAmountString;
}
      const validCategories = [
        'Clothes',
        'Electronics',
        'Accessories',
        'Household Items',
        'Gifts',
        'Other',
      ];

      const normalizedType = String(shipmentType || 'DOCUMENT')
  .trim()
  .toUpperCase();

      if (!['DOCUMENT', 'NON_DOCUMENT'].includes(normalizedType)) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid shipment type.',
        });
      }

      if (normalizedType === 'NON_DOCUMENT') {
        if (!validCategories.includes(itemCategory)) {
          return res.status(400).json({
            success: false,
            message: 'Please select a valid item category.',
          });
        }

        if (
          itemCategory === 'Other' &&
          (!itemName?.trim() || !itemDescription?.trim())
        ) {
          return res.status(400).json({
            success: false,
            message: 'Item name and description are required for Other.',
          });
        }
      }
      const customer = await prisma.user.findUnique({
  where: { id: req.user.userId },
  select: { name: true, email: true },
});  
if (
  !req.body.pickupCity?.trim() ||
  !req.body.deliveryCity?.trim() ||
  !Number.isFinite(Number(req.body.productValue)) ||
  Number(req.body.productValue) <= 0 ||
  !req.body.itemName?.trim()
) {
  return res.status(400).json({
    success: false,
    message: 'Pickup city, delivery city, product name and valid product value are required.',
  });
}

      const draft = await prisma.shipmentDraft.create({
        data: {
          customerId: req.user.userId,

          pickupName: pickupName.trim(),
          pickupPhone: String(pickupPhone),
          pickupAddress: pickupAddress.trim(),
          pickupPincode: String(pickupPincode),
         pickupCity: req.body.pickupCity.trim(),
          deliveryName: deliveryName.trim(),
          deliveryPhone: String(deliveryPhone),
          deliveryAddress: deliveryAddress.trim(),
          deliveryPincode: String(deliveryPincode),
           deliveryCity: req.body.deliveryCity.trim(),
productValue: Number(req.body.productValue),
          weightGrams: Math.round(weightKg * 1000),
          paymentMode: normalizedPaymentMode,
codAmount: normalizedCodAmount,


          shipmentType: normalizedType,
          
          itemCategory:
            normalizedType === 'NON_DOCUMENT' ? itemCategory : null,

          itemName:
  normalizedType === 'NON_DOCUMENT'
    ? String(itemName || itemCategory).trim()
    : 'Document',

          itemDescription:
            normalizedType === 'NON_DOCUMENT' && itemCategory === 'Other'
              ? itemDescription.trim()
              : null,
        },
      });
            // Notify admins about the new shipment draft.
      await prisma.adminNotification.create({
        data: {
          title: 'New Shipment Draft',
          message: `${customer?.name || customer?.email || 'A customer'} saved a shipment draft (${pickupPincode} → ${deliveryPincode}).`,
          type: 'SHIPMENT_DRAFT',
          link: '/admin/shipments',
        },
      });

     const {
  shipNextRate,
  delhiveryExpressRate,
  delhiveryStandardRate,
  rateApprovedById,
  ...safeDraft
} = draft;

return res.status(201).json({
  success: true,
  message: 'Shipment details saved successfully.',
  draft: safeDraft,
});
    } catch (error) {
      console.error('Save shipment draft error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to save shipment details.',
      });
    }
  }
);

// CREATE MULTIPLE SHIPMENT DRAFTS FROM CSV UPLOAD

router.post(
  '/bulk-drafts',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  validateChildAccount,
  async (req, res) => {
    try {
      const { shipments } = req.body;
      const customerId = req.user.userId;

      if (!Array.isArray(shipments) || shipments.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please upload shipment rows.',
        });
      }

      if (shipments.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 100 shipments are allowed per upload.',
        });
      }

      const validCategories = [
        'Clothes',
        'Electronics',
        'Accessories',
        'Household Items',
        'Gifts',
        'Other',
      ];

      const validDrafts = [];
      const errors = [];

      shipments.forEach((row, index) => {
        const rowNumber = Number(row.rowNumber) || index + 2;

        const requiredFields = [
          'pickupName',
          'pickupPhone',
          'pickupAddress',
          'pickupPincode',
          'deliveryName',
          'deliveryPhone',
          'deliveryAddress',
          'deliveryPincode',
          'weight',
        ];

        const missingField = requiredFields.find(
          (field) =>
            row[field] === undefined ||
            row[field] === null ||
            String(row[field]).trim() === ''
        );

        if (missingField) {
          errors.push({
            rowNumber,
            message: `${missingField} is required.`,
          });
          return;
        }

        const pickupPhone = String(row.pickupPhone).trim();
        const deliveryPhone = String(row.deliveryPhone).trim();
        const pickupPincode = String(row.pickupPincode).trim();
        const deliveryPincode = String(row.deliveryPincode).trim();

        if (
          !/^[0-9]{10}$/.test(pickupPhone) ||
          !/^[0-9]{10}$/.test(deliveryPhone)
        ) {
          errors.push({
            rowNumber,
            message: 'Both mobile numbers must contain 10 digits.',
          });
          return;
        }

        if (
          !validPincode(pickupPincode) ||
          !validPincode(deliveryPincode)
        ) {
          errors.push({
            rowNumber,
            message: 'Both PIN codes must contain 6 digits.',
          });
          return;
        }

        const weightKg = Number(row.weight);

        if (!Number.isFinite(weightKg) || weightKg < 0.5) {
          errors.push({
            rowNumber,
            message: 'Minimum parcel weight is 500 grams.',
          });
          return;
        }

        const paymentMode = String(row.paymentMode || 'PREPAID')
          .trim()
          .toUpperCase();

        if (!['PREPAID', 'COD'].includes(paymentMode)) {
          errors.push({
            rowNumber,
            message: 'Payment mode must be PREPAID or COD.',
          });
          return;
        }

        let codAmount = null;

        if (paymentMode === 'COD') {
          const amountString = String(row.codAmount ?? '').trim();

          if (
            !/^\d+(\.\d{1,2})?$/.test(amountString) ||
            !Number.isFinite(Number(amountString)) ||
            Number(amountString) <= 0
          ) {
            errors.push({
              rowNumber,
              message: 'Enter a valid COD amount greater than ₹0.',
            });
            return;
          }

          codAmount = amountString;
        }

        const shipmentType = String(row.shipmentType || 'DOCUMENT')
          .trim()
          .toUpperCase();

        if (!['DOCUMENT', 'NON_DOCUMENT'].includes(shipmentType)) {
          errors.push({
            rowNumber,
            message: 'Shipment type must be DOCUMENT or NON_DOCUMENT.',
          });
          return;
        }

        const itemCategory = String(row.itemCategory || '').trim();
        const itemName = String(row.itemName || '').trim();
        const itemDescription = String(row.itemDescription || '').trim();

        if (
          shipmentType === 'NON_DOCUMENT' &&
          !validCategories.includes(itemCategory)
        ) {
          errors.push({
            rowNumber,
            message: 'Please select a valid item category.',
          });
          return;
        }

        if (
          shipmentType === 'NON_DOCUMENT' &&
          itemCategory === 'Other' &&
          (!itemName || !itemDescription)
        ) {
          errors.push({
            rowNumber,
            message: 'Item name and description are required for Other.',
          });
          return;
        }

        validDrafts.push({
          customerId,

          pickupName: String(row.pickupName).trim(),
          pickupPhone,
          pickupAddress: String(row.pickupAddress).trim(),
          pickupPincode,

          deliveryName: String(row.deliveryName).trim(),
          deliveryPhone,
          deliveryAddress: String(row.deliveryAddress).trim(),
          deliveryPincode,

          weightGrams: Math.round(weightKg * 1000),

          paymentMode,
          codAmount,

          shipmentType,

          itemCategory:
            shipmentType === 'NON_DOCUMENT' ? itemCategory : null,

          itemName:
            shipmentType === 'NON_DOCUMENT' && itemCategory === 'Other'
              ? itemName
              : null,

          itemDescription:
            shipmentType === 'NON_DOCUMENT' && itemCategory === 'Other'
              ? itemDescription
              : null,

          childAccountId: req.childAccount?.id || null,

          rowNumber,
        });
      });

      let createdDrafts = [];

      if (validDrafts.length > 0) {
        createdDrafts = await prisma.$transaction(async (tx) => {
          const created = [];

          for (const draftData of validDrafts) {
            const { rowNumber, ...data } = draftData;

            const draft = await tx.shipmentDraft.create({
              data,
            });

          const {
  shipNextRate,
  delhiveryExpressRate,
  delhiveryStandardRate,
  rateApprovedById,
  ...safeDraft
} = draft;

created.push({
  ...safeDraft,
  rowNumber,
});
          }

          return created;
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Bulk shipment validation completed.',
        totalRows: shipments.length,
        successfulRows: createdDrafts.length,
        failedRows: errors.length,
        drafts: createdDrafts,
        errors,
      });
    } catch (error) {
      console.error('Bulk shipment draft error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to process bulk shipment upload.',
      });
    }
  }
);

// CONFIRM MULTIPLE SHIPMENTS WITH ONE WALLET PAYMENT

router.post(
  '/bulk-confirm',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const { shipments } = req.body;
      const customerId = req.user.userId;

      if (!Array.isArray(shipments) || shipments.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No shipments provided for confirmation.',
        });
      }

      if (shipments.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 100 shipments can be confirmed at once.',
        });
      }

      const draftIds = shipments.map((item) => item?.draftId);

      if (
        draftIds.some((id) => !id) ||
        new Set(draftIds).size !== draftIds.length
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or duplicate shipment draft IDs.',
        });
      }

      for (const item of shipments) {
        if (!VALID_MODES.includes(item.mode)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid shipping mode selected.',
          });
        }
      }

      const result = await prisma.$transaction(
        async (tx) => {
          const drafts = await tx.shipmentDraft.findMany({
            where: {
              id: { in: draftIds },
              customerId,
            },
          });

          if (drafts.length !== draftIds.length) {
            throw new Error('DRAFT_NOT_FOUND');
          }

          const existingShipments = await tx.shipment.findMany({
            where: {
              draftId: { in: draftIds },
            },
            select: {
              draftId: true,
            },
          });

          if (existingShipments.length > 0) {
            throw new Error('ALREADY_BOOKED');
          }

          const serviceabilityRecords =
            await tx.courierPincodeServiceability.findMany({
              where: {
                courier: { in: COURIERS },
                pincode: {
                  in: [
                    ...new Set(
                      drafts.flatMap((draft) => [
                        draft.pickupPincode,
                        draft.deliveryPincode,
                      ])
                    ),
                  ],
                },
              },
            });

          const preparedShipments = [];

          for (const item of shipments) {
            const draft = drafts.find(
              (entry) => entry.id === item.draftId
            );
             const validRateOptions = [
  'SHIPNEXT',
  'DELHIVERY_EXPRESS',
  'DELHIVERY_STANDARD',
];

if (
  draft.rateApprovalStatus !== 'APPROVED' ||
  !validRateOptions.includes(draft.selectedRateOption) ||
  draft.approvedShippingCharge === null ||
  draft.approvedShippingCharge === undefined ||
  Number(draft.approvedShippingCharge) <= 0
) {
  throw new Error('RATE_NOT_APPROVED');
}

if (draft.shippingMode !== item.mode) {
  throw new Error('RATE_MODE_MISMATCH');
}
            if (
              !validPincode(draft.pickupPincode) ||
              !validPincode(draft.deliveryPincode)
            ) {
              throw new Error('INVALID_PINCODE');
            }

            const weightKg = draft.weightGrams / 1000;

            if (weightKg < 0.5) {
              throw new Error('INVALID_WEIGHT');
            }
           const isAirMode =
  item.mode === 'EXPRESS_AIR' ||
  item.mode === 'NORMAL_AIR';

let courier;

if (isAirMode) {
  // Air shipments: Skyking only.
  const skykingPickup = serviceabilityRecords.find(
    (record) =>
      record.courier === 'SKYKING' &&
      record.pincode === draft.pickupPincode
  );

  const skykingDelivery = serviceabilityRecords.find(
    (record) =>
      record.courier === 'SKYKING' &&
      record.pincode === draft.deliveryPincode
  );

  if (
    skykingPickup?.firstMile !== true ||
    skykingDelivery?.lastMile !== true
  ) {
    throw new Error('AIR_NOT_SERVICEABLE');
  }

  courier = 'SKYKING';
} else {
  // Surface shipments: retain existing allocation.
  courier = COURIERS.find((name) => {
    const hasPickup = serviceabilityRecords.some(
      (record) =>
        record.courier === name &&
        record.pincode === draft.pickupPincode
    );

    const hasDelivery = serviceabilityRecords.some(
      (record) =>
        record.courier === name &&
        record.pincode === draft.deliveryPincode
    );

    return hasPickup && hasDelivery;
  });

  if (!courier) {
    throw new Error('NOT_SERVICEABLE');
  }
}
            const pickupRecord = serviceabilityRecords.find(
              (record) =>
                record.courier === courier &&
                record.pincode === draft.pickupPincode
            );

            const deliveryRecord = serviceabilityRecords.find(
              (record) =>
                record.courier === courier &&
                record.pincode === draft.deliveryPincode
            );

            // Use the exact rate approved by ShipNext admin.
const amount = Number(
  Number(draft.approvedShippingCharge).toFixed(2)
);

            if (!Number.isFinite(amount) || amount <= 0) {
              throw new Error('INVALID_CHARGE');
            }

            preparedShipments.push({
              draft,
              mode: item.mode,
              amount,
              trackingId: generateTrackingId(),
              docketNumber: generateDocketNumber(),
              courierPartner: courier,
            });
          }

          
         const totalAmount = Number(
  preparedShipments
    .filter((item) => item.draft.paymentMode !== 'COD')
    .reduce((sum, item) => sum + item.amount, 0)
    .toFixed(2)
);

let wallet = null;

if (totalAmount > 0) {
  wallet = await tx.wallet.upsert({
    where: { userId: customerId },
    update: {},
    create: {
      userId: customerId,
      balance: 0,
    },
  });

  const debit = await tx.wallet.updateMany({
    where: {
      id: wallet.id,
      balance: { gte: totalAmount },
    },
    data: {
      balance: { decrement: totalAmount },
    },
  });

  if (debit.count !== 1) {
    throw new Error('INSUFFICIENT_BALANCE');
  }
}


          const bookedShipments = [];

          for (const item of preparedShipments) {
           const {
  draft,
  mode,
  amount,
  trackingId,
  docketNumber,
  courierPartner,
} = item; 

            await tx.shipmentDraft.update({
              where: { id: draft.id },
              data: {
                shippingMode: mode,
              },
            });

            const shipment = await tx.shipment.create({
              data: {
                draftId: draft.id,
                customerId,

                trackingId,
                docketNumber,
                processingDate: new Date(),
                status: 'CONFIRMED',
                shippingMode: mode,

                pickupName: draft.pickupName,
                pickupPhone: draft.pickupPhone,
                pickupAddress: draft.pickupAddress,
                pickupPincode: draft.pickupPincode,

                deliveryName: draft.deliveryName,
                deliveryPhone: draft.deliveryPhone,
                deliveryAddress: draft.deliveryAddress,
                deliveryPincode: draft.deliveryPincode,

                weightGrams: draft.weightGrams,
                shippingCharge: amount.toFixed(2),
                selectedRateOption: draft.selectedRateOption,
                paymentMode: draft.paymentMode === 'COD' ? 'COD' : 'WALLET',
recipientPaymentMode: draft.paymentMode,

codAmount:
  draft.paymentMode === 'COD'
    ? draft.codAmount
    : null,

codCharge:
  draft.paymentMode === 'COD'
    ? (
        Number(draft.codAmount) <= 1500
          ? 30
          : Number((Number(draft.codAmount) * 0.015).toFixed(2))
      )
    : null,

codNetAmount:
  draft.paymentMode === 'COD'
    ? Number((
        Number(draft.codAmount) -
        (
          Number(draft.codAmount) <= 1500
            ? 30
            : Number((Number(draft.codAmount) * 0.015).toFixed(2))
        )
      ).toFixed(2))
    : null,
                codCollectionStatus:
                  draft.paymentMode === 'COD' ? 'PENDING' : null,

                codRemittanceStatus:
                  draft.paymentMode === 'COD' ? 'PENDING' : null,

                childAccountId: draft.childAccountId || null,
              },
            });

            if (draft.paymentMode !== 'COD') {
  await tx.walletTransaction.create({
    data: {
      userId: customerId,
      walletId: wallet.id,
      type: 'DEBIT',
      amount: amount.toFixed(2),
      description: `Shipment booking payment - ${trackingId}`,
      reference: `SHIPMENT-${trackingId}`,
    },
  });
}

            bookedShipments.push({
              ...shipment,
              shippingCharge: amount.toFixed(2),
            });
          }

         const updatedWallet = wallet
  ? await tx.wallet.findUnique({
      where: { userId: customerId },
    })
  : null;

return {
  shipments: bookedShipments,
  totalAmount,
  walletBalance: updatedWallet
    ? updatedWallet.balance.toString()
    : null,
};
        },
        {
          isolationLevel: 'Serializable',
        }
      );

      return res.status(201).json({
  success: true,
  message: 'All shipments booked successfully.',
  shipments: result.shipments,
  payment: {
    paymentMode:
      result.shipments.every(
        (shipment) => shipment.recipientPaymentMode === 'COD'
      )
        ? 'COD'
        : result.shipments.some(
            (shipment) => shipment.recipientPaymentMode === 'COD'
          )
          ? 'MIXED'
          : 'WALLET',

    amount: result.totalAmount,
    walletBalance: result.walletBalance,
    status:
      result.totalAmount === 0
        ? 'NOT_REQUIRED'
        : 'SUCCESS',
  },
});
    } catch (error) {
      console.error('Bulk shipment confirmation error:', error);

      const errors = {
        DRAFT_NOT_FOUND: [404, 'One or more shipment drafts were not found.'],
        ALREADY_BOOKED: [409, 'One or more shipments have already been booked.'],
        INVALID_PINCODE: [400, 'One or more PIN codes are invalid.'],
        INVALID_WEIGHT: [400, 'One or more shipments have an invalid weight.'],
        NOT_SERVICEABLE: [404, 'One or more shipments are not serviceable.'],
        INVALID_CHARGE: [400, 'Unable to calculate a valid shipping charge.'],
        INSUFFICIENT_BALANCE: [400, 'Insufficient wallet balance for all shipments.'],
        AIR_NOT_SERVICEABLE: [
  404,
  'Air shipment unavailable: Skyking requires First Mile service at pickup and Last Mile service at delivery.',
],
RATE_NOT_APPROVED: [
  409,
  'One or more shipments are awaiting admin rate approval.',
],
RATE_MODE_MISMATCH: [
  409,
  'A shipment mode has changed. Please request rate approval again.',
],
      };

      if (errors[error.message]) {
        const [status, message] = errors[error.message];

        return res.status(status).json({
          success: false,
          message,
        });
      }

      if (error.code === 'P2034' || error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'A booking conflict occurred. Please try again.',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Unable to confirm bulk shipments.',
      });
    }
  }
);

// GET CUSTOMER DRAFTS WITHOUT INTERNAL RATE AMOUNTS

router.get(
  '/drafts/my',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const drafts = await prisma.shipmentDraft.findMany({
        where: {
          customerId: req.user.userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          customerId: true,

          pickupName: true,
          pickupPhone: true,
          pickupAddress: true,
          pickupPincode: true,
          pickupCity: true,

          deliveryName: true,
          deliveryPhone: true,
          deliveryAddress: true,
          deliveryPincode: true,
          deliveryCity: true,

          weightGrams: true,
          productValue: true,
          shipmentType: true,
          itemCategory: true,
          itemName: true,
          itemDescription: true,

          paymentMode: true,
          codAmount: true,

          shippingMode: true,

          rateApprovalStatus: true,
          approvedShippingCharge: true,
          selectedRateOption: true,
          rateApprovedAt: true,

          createdAt: true,
        },
      });

      return res.json({
        success: true,
        drafts,
      });
    } catch (error) {
      console.error('Get customer shipment drafts error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve your shipment drafts.',
      });
    }
  }
);


// GET A CUSTOMER'S OWN SHIPMENT DRAFT

router.get(
  '/drafts/:id',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const draft = await prisma.shipmentDraft.findFirst({
        where: {
          id: req.params.id,
          customerId: req.user.userId,
        },
        select: {
          id: true,
          customerId: true,

          pickupName: true,
          pickupPhone: true,
          pickupAddress: true,
          pickupPincode: true,
          pickupCity: true,

          deliveryName: true,
          deliveryPhone: true,
          deliveryAddress: true,
          deliveryPincode: true,
          deliveryCity: true,

          weightGrams: true,
          productValue: true,
          shipmentType: true,
          itemCategory: true,
          itemName: true,
          itemDescription: true,

          paymentMode: true,
          codAmount: true,

          shippingMode: true,

          // Customer may see approval status and approved amount only.
          rateApprovalStatus: true,
          approvedShippingCharge: true,
          selectedRateOption: true,
          rateApprovedAt: true,

          createdAt: true,
        },
      });

      if (!draft) {
        return res.status(404).json({
          success: false,
          message: 'Shipment draft not found.',
        });
      }

      return res.json({
        success: true,
        draft,
      });
    } catch (error) {
      console.error('Get shipment draft error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve shipment details.',
      });
    }
  }
);


// CONFIRM SHIPMENT AND PAY USING SHIPNEXT WALLET

router.post(
  '/confirm',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const { draftId, mode, courier } = req.body;
const requestedCourier = String(courier || '').toUpperCase();

const allowedCouriers = [
  ...COURIERS,
  'SHADOWFAX',
];

if (!allowedCouriers.includes(requestedCourier)) {
  return res.status(400).json({
    success: false,
    message: 'Please select a valid courier partner.',
  });
}
      const customerId = req.user.userId;
     const customer = await prisma.user.findUnique({
  where: { id: customerId },
  select: {
    name: true,
    email: true,
    companyName: true,
    address: true,
    city: true,
    state: true,
    pincode: true,
  },
});

      if (!draftId) {
        return res.status(400).json({
          success: false,
          message: 'Shipment draft ID is required.',
        });
      }

      if (!VALID_MODES.includes(mode)) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid shipping mode.',
        });
      }
      // Air modes are exclusively assigned to Skyking.
const isAirMode =
  mode === 'EXPRESS_AIR' ||
  mode === 'NORMAL_AIR';

if (isAirMode && requestedCourier !== 'SKYKING') {
  return res.status(400).json({
    success: false,
    message: 'Air shipments are available only through Skyking.',
  });
}
      // Verify the draft before making the live Shadowfax serviceability request.
const preflightDraft = await prisma.shipmentDraft.findFirst({
  where: {
    id: draftId,
    customerId,
  },
});

if (!preflightDraft) {
  return res.status(404).json({
    success: false,
    message: 'Shipment draft not found.',
  });
}
// Customer cannot book until an admin approves one of the three rates.
const validRateOptions = [
  'SHIPNEXT',
  'DELHIVERY_EXPRESS',
  'DELHIVERY_STANDARD',
];

if (
  preflightDraft.rateApprovalStatus !== 'APPROVED' ||
  !validRateOptions.includes(preflightDraft.selectedRateOption) ||
  preflightDraft.approvedShippingCharge === null ||
  Number(preflightDraft.approvedShippingCharge) <= 0
) {
  return res.status(409).json({
    success: false,
    message: 'Your shipment is awaiting admin shipping-rate approval. You can book after approval.',
  });
}
if (requestedCourier === 'SHADOWFAX') {
  if (Number(preflightDraft.productValue) >= 50000) {
    return res.status(400).json({
      success: false,
      message: 'Shadowfax bookings of ₹50,000 or more require an e-way bill. Please add e-way bill support before booking.',
    });
  }

  const isServiceable = await checkShadowfaxMode(
    preflightDraft.pickupPincode,
    preflightDraft.deliveryPincode,
    mode
  );

  if (!isServiceable) {
    return res.status(404).json({
      success: false,
      message: 'Shadowfax does not support the selected shipping mode for these PIN codes.',
    });
  }
}
      const result = await prisma.$transaction(
        
        async (tx) => {
          // Verify that the draft belongs to this customer.
          const draft = await tx.shipmentDraft.findFirst({
            where: {
              id: draftId,
              customerId,
            },
          });

          // Recheck approval inside the transaction to prevent bypasses.
if (
  draft.rateApprovalStatus !== 'APPROVED' ||
  !validRateOptions.includes(draft.selectedRateOption) ||
  draft.approvedShippingCharge === null ||
  Number(draft.approvedShippingCharge) <= 0
) {
  const error = new Error(
    'Your shipment is awaiting admin shipping-rate approval.'
  );
  error.code = 'RATE_NOT_APPROVED';
  throw error;
}

          // Prevent booking the same draft more than once.
          const existingShipment = await tx.shipment.findUnique({
            where: {
              draftId: draft.id,
            },
          });

          if (existingShipment) {
            const error = new Error('This shipment is already booked.');
            error.code = 'ALREADY_BOOKED';
            error.shipment = existingShipment;
            throw error;
          }

          // Verify both PIN codes.
          const pickupPincode = draft.pickupPincode;
          const deliveryPincode = draft.deliveryPincode;

          if (
            !validPincode(pickupPincode) ||
            !validPincode(deliveryPincode)
          ) {
            const error = new Error('Invalid shipment PIN codes.');
            error.code = 'INVALID_PIN';
            throw error;
          }

          // Check actual courier PIN coverage.
          const locationRecords =
            await tx.courierPincodeServiceability.findMany({
              where: {
                courier: {
                  in: COURIERS,
                },
                pincode: {
                  in: [pickupPincode, deliveryPincode],
                },
              },
            });

         let selectedCourier = requestedCourier;
let zoneCourier = requestedCourier;

if (requestedCourier === 'SHADOWFAX') {
  // Use existing courier PIN records only to determine the shipping zone.
  zoneCourier = COURIERS.find((courier) => {
    const hasPickup = locationRecords.some(
      (item) =>
        item.courier === courier &&
        item.pincode === pickupPincode
    );

    const hasDelivery = locationRecords.some(
      (item) =>
        item.courier === courier &&
        item.pincode === deliveryPincode
    );

    return hasPickup && hasDelivery;
  });

  if (!zoneCourier) {
    const error = new Error(
      'Unable to determine the shipping zone for these PIN codes.'
    );
    error.code = 'NOT_SERVICEABLE';
    throw error;
  }
} else {
  const hasPickup = locationRecords.some(
    (item) =>
      item.courier === requestedCourier &&
      item.pincode === pickupPincode
  );

  const hasDelivery = locationRecords.some(
    (item) =>
      item.courier === requestedCourier &&
      item.pincode === deliveryPincode
  );

  if (!hasPickup || !hasDelivery) {
    const error = new Error(
      `${requestedCourier} does not cover both PIN codes.`
    );
    error.code = 'NOT_SERVICEABLE';
    throw error;
  }

  // Skyking Air requires First Mile at pickup
  // and Last Mile at delivery.
  if (isAirMode) {
    const skykingPickup = locationRecords.find(
      (item) =>
        item.courier === 'SKYKING' &&
        item.pincode === pickupPincode
    );

    const skykingDelivery = locationRecords.find(
      (item) =>
        item.courier === 'SKYKING' &&
        item.pincode === deliveryPincode
    );

    if (
      skykingPickup?.firstMile !== true ||
      skykingDelivery?.lastMile !== true
    ) {
      const error = new Error(
        'Skyking Air is unavailable. Pickup requires First Mile and delivery requires Last Mile serviceability.'
      );
      error.code = 'NOT_SERVICEABLE';
      throw error;
    }
  }
}
const pickup = locationRecords.find(
  (item) =>
    item.courier === zoneCourier &&
    item.pincode === pickupPincode
);

const delivery = locationRecords.find(
  (item) =>
    item.courier === zoneCourier &&
    item.pincode === deliveryPincode
);
          // Recalculate price on the backend.
          const weightKg = draft.weightGrams / 1000;

          if (weightKg < 0.5) {
            const error = new Error(
              'Minimum shipment weight is 500 grams.'
            );
            error.code = 'INVALID_WEIGHT';
            throw error;
          }
           
          const zone = getShippingZone(pickup, delivery);

          const pricingMode = mode.endsWith('_AIR')
            ? 'AIR'
            : 'SURFACE';

          const charge = calculateShippingCharge(
            zone,
            pricingMode,
            weightKg
          );

          // Load customer's saved tax preferences.
const taxSettings = await tx.customerTaxSettings.findUnique({
  where: { userId: customerId },
});

const gstRate = Number(taxSettings?.defaultGstRate ?? 18);
const taxInclusive = taxSettings?.taxInclusive ?? false;

// Determine billing state.
const billingState =
  taxSettings?.placeOfSupply || customer?.state || '';

const normalizedState = billingState.trim().toLowerCase();

if (!normalizedState) {
  const error = new Error(
    'Please update your billing state in Company Details before booking.'
  );
  error.code = 'BILLING_STATE_REQUIRED';
  throw error;
}

// Gujarat supplier GST registration.
const isIntraState =
  normalizedState === 'gujarat' || normalizedState === 'gj' ||
  normalizedState === '24';

// Calculate taxable value and GST.
// Admin-approved rate is authoritative for this booking.
const grossCharge = Number(draft.approvedShippingCharge);
const taxableAmount = taxInclusive
  ? Number((grossCharge / (1 + gstRate / 100)).toFixed(2))
  : grossCharge;

const totalTax = Number(
  (taxableAmount * gstRate / 100).toFixed(2)
);

const cgstAmount = isIntraState
  ? Number((totalTax / 2).toFixed(2))
  : 0;

const sgstAmount = isIntraState
  ? Number((totalTax - cgstAmount).toFixed(2))
  : 0;

const igstAmount = isIntraState ? 0 : totalTax;

const amount = taxInclusive
  ? grossCharge
  : Number((taxableAmount + totalTax).toFixed(2));

         
const isCod = draft.paymentMode === 'COD';
const codAmount = isCod ? Number(draft.codAmount || 0) : null;

if (isCod && (!Number.isFinite(codAmount) || codAmount <= 0)) {
  const error = new Error('Please enter a valid COD amount.');
  error.code = 'INVALID_COD_AMOUNT';
  throw error;
}

const codCharge = isCod
  ? (codAmount <= 1500 ? 30 : Number((codAmount * 0.015).toFixed(2)))
  : null;

const codNetAmount = isCod
  ? Number((codAmount - codCharge).toFixed(2))
  : null;

// Generate shipment identifiers before creating wallet transactions.
const trackingId = generateTrackingId();
const docketNumber = generateDocketNumber();

let wallet = null;

if (!isCod) {
  wallet = await tx.wallet.upsert({
    where: { userId: customerId },
    create: {
      userId: customerId,
      balance: 0,
    },
    update: {},
  });

  const debit = await tx.wallet.updateMany({
    where: {
      id: wallet.id,
      balance: { gte: amount },
    },
    data: {
      balance: { decrement: amount },
    },
  });

  if (debit.count !== 1) {
    const error = new Error(
      'Insufficient wallet balance. Please recharge your wallet.'
    );
    error.code = 'INSUFFICIENT_BALANCE';
    throw error;
  }
}


          if (!isCod) {
  await tx.walletTransaction.create({
    data: {
      userId: customerId,
      walletId: wallet.id,
      type: 'DEBIT',
      amount,
      description: `Shipment booking payment - ${trackingId}`,
      reference: `SHIPMENT-${trackingId}`,
    },
  });
}

          // Store selected mode in the draft.
          await tx.shipmentDraft.update({
            where: {
              id: draft.id,
            },
            data: {
              shippingMode: mode,
            },
          });

// Create confirmed ShipNext shipment.
const shipment = await tx.shipment.create({
            data: {
              draftId: draft.id,
              customerId,

              trackingId,
              docketNumber,
             
              courierPartner: selectedCourier,
                processingDate: getProcessingDate(),
              status: 'CONFIRMED',
              shippingMode: mode,

              pickupName: draft.pickupName,
              pickupPhone: draft.pickupPhone,
              pickupAddress: draft.pickupAddress,
pickupPincode: draft.pickupPincode,
              deliveryName: draft.deliveryName,
              deliveryPhone: draft.deliveryPhone,
              deliveryAddress: draft.deliveryAddress,
              deliveryPincode: draft.deliveryPincode,

            weightGrams: draft.weightGrams,
shippingCharge: amount,
selectedRateOption: draft.selectedRateOption,

// ShipNext shipping-charge payment
           paymentMode: isCod ? 'COD' : 'WALLET',

// Recipient payment details
// Recipient payment details
recipientPaymentMode: isCod ? 'COD' : 'PREPAID',
codAmount: isCod ? codAmount : null,
codCharge,
codNetAmount,

codCollectionStatus: isCod ? 'COD_PENDING' : null,
codRemittanceStatus: isCod ? 'REMITTANCE_PENDING' : null,
codSettlementStatus: isCod ? 'PENDING' : null,
            },
          });
          // Automatically generate invoice for the confirmed shipment.
const invoiceNumber = await generateInvoiceNumber(tx, {
  shipmentType: draft.shipmentType,
  shippingMode: mode,
  paymentMode: draft.paymentMode,
});
const invoice = await tx.shipmentInvoice.create({
  data: {
    invoiceNumber,
    shipmentId: shipment.id,
    customerId,
    docketNumber: shipment.docketNumber,

    billingName: customer.companyName || customer.name,
   billingGst: customer.gstNumber || null,
    billingAddress: customer.address || null,
    billingState: billingState,
    billingPincode: customer.pincode || null,

    shippingCharge: taxableAmount,
    codCharge: 0,
    taxableAmount,

    gstRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalTax,
    totalAmount: amount,

    paymentStatus: isCod ? 'PENDING' : 'PAID',
  },
});
           // Notify admins about the new shipment booking.
await tx.adminNotification.create({
  data: {
    title: 'New Shipment Booked',
    message: `${customer?.name || customer?.email || 'A customer'} booked shipment ${trackingId}.`,
    type: 'SHIPMENT_BOOKED',
    link: '/admin/shipments',
  },
});
          

       const updatedWallet = wallet
  ? await tx.wallet.findUnique({
      where: { userId: customerId },
    })
  : null;

return {
  shipment,
  invoice,
  walletBalance: updatedWallet?.balance ?? null,
  isCod,
  charge,
};
        },
        {
          isolationLevel: 'Serializable',
        }
      );
     // Create the live Shadowfax order only after the database transaction commits.
if (requestedCourier === 'SHADOWFAX') {
  const draft = await prisma.shipmentDraft.findUnique({
    where: { id: draftId },
  });

  const isCod = draft.paymentMode === 'COD';
  

  const shadowfaxPayload = {
    customer_details: {
      name: draft.deliveryName,
      contact: draft.deliveryPhone,
      address_line_1: draft.deliveryAddress,
      city: draft.deliveryCity,
      pincode: draft.deliveryPincode,
    },

    order_details: {
      client_order_id: result.shipment.trackingId,
      product_value: Number(draft.productValue),
      payment_mode: isCod ? 'cod' : 'prepaid',
      cod_amount: isCod ? Number(draft.codAmount) : 0,
      order_service: 'Regular',
      order_identifier: mode.startsWith('EXPRESS')
        ? 'express'
        : 'regular',
      actual_weight: draft.weightGrams / 1000,
    },

    pickup_details: {
      pickup_type: 'seller',
      name: draft.pickupName,
      contact: draft.pickupPhone,
      address_line_1: draft.pickupAddress,
      city: draft.pickupCity,
      pincode: draft.pickupPincode,
    },

    return_details: {
      return_type: 'seller',
      name: draft.pickupName,
      contact: draft.pickupPhone,
      address_line_1: draft.pickupAddress,
      city: draft.pickupCity,
      pincode: draft.pickupPincode,
    },

    product_details: [
      {
        sku_name: draft.itemName || 'Shipment',
        sku_id: draft.id,
        price: Number(draft.productValue),
        additional_details: {
          quantity: 1,
          mode: mode.endsWith('_AIR') ? 'air' : 'surface',
        },
      },
    ],
  };

  try {
    const shadowfaxResult = await createShadowfaxShipment(
      shadowfaxPayload
    );

    result.shipment = await prisma.shipment.update({
      where: { id: result.shipment.id },
      data: {
        courierAwb: shadowfaxResult.awb_number,
        awbAssignedAt: new Date(),
      },
    });
  } catch (shadowfaxError) {
    console.error('Shadowfax live booking error:', shadowfaxError);

    await prisma.shipment.update({
      where: { id: result.shipment.id },
      data: { status: 'PENDING' },
    });

    return res.status(502).json({
  success: false,
  paymentStatus: result.isCod ? 'NOT_REQUIRED' : 'PAID',
  message:
    'Shipment record was created, but Shadowfax confirmation is pending. Do not book again. Contact ShipNext support with tracking ID: ' +
    result.shipment.trackingId,
  trackingId: result.shipment.trackingId,
});
  }
}
     return res.status(201).json({
  success: true,
  message: result.isCod
    ? 'COD shipment booked successfully.'
    : 'Shipment booked and wallet payment successful.',
  shipment: result.shipment,
  invoice: result.invoice,
  payment: {
    paymentMode: result.isCod ? 'COD' : 'WALLET',
    amount: result.isCod
      ? 0
      : Number(result.shipment.shippingCharge),
    walletBalance: result.walletBalance,
    status: result.isCod ? 'NOT_REQUIRED' : 'SUCCESS',
  },
});
    } catch (error) {
      console.error('Shipment booking error:', error);

      if (error.code === 'DRAFT_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.code === 'ALREADY_BOOKED') {
        return res.status(409).json({
          success: false,
          message: error.message,
          shipment: error.shipment,
        });
      }

      if (error.code === 'INVALID_PIN' ||
          error.code === 'INVALID_WEIGHT') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.code === 'NOT_SERVICEABLE') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
     if (error.code === 'INVALID_COD_AMOUNT') {
  return res.status(400).json({
    success: false,
    message: error.message,
  });
}     if (error.code === 'RATE_NOT_APPROVED') {
  return res.status(409).json({
    success: false,
    message: error.message,
  });
}
      if (error.code === 'INSUFFICIENT_BALANCE') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.code === 'P2034' || error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message:
            'This booking may already have been processed. Please refresh your shipments before trying again.',
        });
      }
    if (error.code === 'BILLING_STATE_REQUIRED') {
  return res.status(400).json({
    success: false,
    message: error.message,
  });
}
      return res.status(500).json({
        success: false,
        message: 'Unable to complete shipment booking.',
      });
    }
  }
);

// GET LOGGED-IN CUSTOMER'S CONFIRMED SHIPMENTS

router.get(
  '/my',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const shipments = await prisma.shipment.findMany({
        where: {
          customerId: req.user.userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          trackingId: true,
          docketNumber: true,
          status: true,
          shippingMode: true,
          pickupPincode: true,
          deliveryPincode: true,
          weightGrams: true,
          shippingCharge: true,
          paymentMode: true,
          createdAt: true,
          recipientPaymentMode: true,
codAmount: true,
codCollectionStatus: true,
codRemittanceStatus: true,
codCollectedAt: true,
codRemittanceReference: true,
        },
      });

      return res.json({
        success: true,
        shipments,
      });
    } catch (error) {
      console.error('Get customer shipments error:', error);

      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve your shipments.',
      });
    }
  }
);

// TRACK A SHIPMENT USING SHIPNEXT TRACKING ID

router.get('/track/:trackingId', async (req, res) => {
  try {
    const trackingId = req.params.trackingId.trim();

    const shipment = await prisma.shipment.findUnique({
      where: { trackingId },
      select: {
        trackingId: true,
        docketNumber: true,
        status: true,
        courierPartner: true,
        courierAwb: true,
        awbAssignedAt: true,
        pickupPincode: true,
        deliveryPincode: true,
        weightGrams: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'No shipment found with this tracking ID.',
      });
    }

    let courierTracking = null;
    let courierTrackingError = null;

    // Fetch live tracking from Shadowfax
    if (
      shipment.courierPartner?.toUpperCase() === 'SHADOWFAX' &&
      shipment.courierAwb
    ) {
      try {
        courierTracking = await trackShadowfaxShipment(
          shipment.courierAwb
        );
      } catch (error) {
        console.error('Shadowfax tracking error:', error.message);
        courierTrackingError = 'Unable to fetch the latest courier tracking update.';
      }
    }

    return res.json({
      success: true,
      shipment,
      courierTracking,
      courierTrackingError,
    });

  } catch (error) {
    console.error('Track shipment error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to track this shipment.',
    });
  }
});

// VERIFY CHILD ACCOUNT BEFORE SHIPMENT BOOKING
// VERIFY CHILD ACCOUNT BEFORE SHIPMENT BOOKING
async function validateChildAccount(req, res, next) {
  try {
    const { childAccountId } = req.body;

    if (!childAccountId) {
      return next();
    }

    const child = await prisma.childAccount.findFirst({
      where: {
        id: childAccountId,
       parentId: req.user.userId,
      },
    });

    if (!child) {
      return res.status(403).json({
        success: false,
        message: 'Invalid child account.',
      });
    }

    if (child.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'This branch is inactive or suspended. Contact ShipNext Admin.',
      });
    }

    req.childAccount = child;
    next();

  } catch (error) {
    
    console.error('Child account validation error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to verify child account.',
    });
  }
}
module.exports = router;
