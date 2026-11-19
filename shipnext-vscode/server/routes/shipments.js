
const express = require('express');
const crypto = require('crypto');
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
  return /^[0-9]{6}$/.test(String(pin || '').trim());
}

function generateTrackingId() {
  return `SN${Date.now()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function generateDocketNumber() {
  return `SNX${Date.now()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

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

      const normalizedType = shipmentType || 'DOCUMENT';

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

      const draft = await prisma.shipmentDraft.create({
        data: {
          customerId: req.user.userId,

          pickupName: pickupName.trim(),
          pickupPhone: String(pickupPhone),
          pickupAddress: pickupAddress.trim(),
          pickupPincode: String(pickupPincode),

          deliveryName: deliveryName.trim(),
          deliveryPhone: String(deliveryPhone),
          deliveryAddress: deliveryAddress.trim(),
          deliveryPincode: String(deliveryPincode),

          weightGrams: Math.round(weightKg * 1000),
          paymentMode: normalizedPaymentMode,
codAmount: normalizedCodAmount,


          shipmentType: normalizedType,
          paymentMode: normalizedPaymentMode,
codAmount: normalizedCodAmount,
          itemCategory:
            normalizedType === 'NON_DOCUMENT' ? itemCategory : null,

          itemName:
            normalizedType === 'NON_DOCUMENT' && itemCategory === 'Other'
              ? itemName.trim()
              : null,

          itemDescription:
            normalizedType === 'NON_DOCUMENT' && itemCategory === 'Other'
              ? itemDescription.trim()
              : null,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Shipment details saved successfully.',
        draft,
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

// GET ALL DRAFTS BELONGING TO THE LOGGED-IN CUSTOMER

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
      const { draftId, mode } = req.body;
      const customerId = req.user.userId;

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

      const result = await prisma.$transaction(
        async (tx) => {
          // Verify that the draft belongs to this customer.
          const draft = await tx.shipmentDraft.findFirst({
            where: {
              id: draftId,
              customerId,
            },
          });

          if (!draft) {
            const error = new Error('Shipment draft not found.');
            error.code = 'DRAFT_NOT_FOUND';
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

          const selectedCourier = COURIERS.find((courier) => {
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

          if (!selectedCourier) {
            const error = new Error(
              'No courier currently covers both PIN codes.'
            );
            error.code = 'NOT_SERVICEABLE';
            throw error;
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

          const amount = charge.total;

          // Get or create the customer's wallet.
          const wallet = await tx.wallet.upsert({
            where: {
              userId: customerId,
            },
            create: {
              userId: customerId,
              balance: 0,
            },
            update: {},
          });

          // Atomically deduct only if sufficient funds exist.
          const debit = await tx.wallet.updateMany({
            where: {
              id: wallet.id,
              balance: {
                gte: amount,
              },
            },
            data: {
              balance: {
                decrement: amount,
              },
            },
          });

          if (debit.count !== 1) {
            const error = new Error(
              'Insufficient wallet balance. Please recharge your wallet.'
            );
            error.code = 'INSUFFICIENT_BALANCE';
            throw error;
          }

          const trackingId = generateTrackingId();
          const docketNumber = generateDocketNumber();

          // Record wallet debit.
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
shippingCharge: amount,

// ShipNext shipping-charge payment
paymentMode: 'WALLET',

// Recipient payment details
recipientPaymentMode: draft.paymentMode || 'PREPAID',
codAmount:
  draft.paymentMode === 'COD'
    ? draft.codAmount
    : null,

codCollectionStatus:
  draft.paymentMode === 'COD' ? 'COD_PENDING' : null,

codRemittanceStatus:
  draft.paymentMode === 'COD' ? 'REMITTANCE_PENDING' : null,
            },
          });

          const updatedWallet = await tx.wallet.findUnique({
            where: {
              id: wallet.id,
            },
          });

          return {
            shipment,
            walletBalance: updatedWallet.balance,
            charge,
          };
        },
        {
          isolationLevel: 'Serializable',
        }
      );

      return res.status(201).json({
        success: true,
        message: 'Shipment booked and wallet payment successful.',
        shipment: result.shipment,
        payment: {
          paymentMode: 'WALLET',
          amount: result.charge.total,
          walletBalance: result.walletBalance,
          status: 'SUCCESS',
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
      where: {
        trackingId,
      },
      select: {
        trackingId: true,
        docketNumber: true,
        status: true,
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

    return res.json({
      success: true,
      shipment,
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
        parentId: req.user.id,
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
