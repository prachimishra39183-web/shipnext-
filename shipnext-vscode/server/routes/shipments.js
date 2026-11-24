
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

function validPincode(pin) {
  return /^[0-9]{6}$/.test(String(pin || '').trim());
}

function generateTrackingId() {
  return `SN${Date.now()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
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
      const customer = await prisma.user.findUnique({
  where: { id: req.user.userId },
  select: { name: true, email: true },
});

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
            // Notify admins about the new shipment draft.
      await prisma.adminNotification.create({
        data: {
          title: 'New Shipment Draft',
          message: `${customer?.name || customer?.email || 'A customer'} saved a shipment draft (${pickupPincode} → ${deliveryPincode}).`,
          type: 'SHIPMENT_DRAFT',
          link: '/admin/shipments',
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

            created.push({
              ...draft,
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

            const courier = COURIERS.find((name) => {
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

            const zone = getShippingZone(
              pickupRecord,
              deliveryRecord
            );

            const pricingMode = item.mode.endsWith('_AIR')
              ? 'AIR'
              : 'SURFACE';

            const charge = calculateShippingCharge(
              zone,
              pricingMode,
              weightKg
            );

            const amount = Number(
              Number(charge.total).toFixed(2)
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
              .reduce((sum, item) => sum + item.amount, 0)
              .toFixed(2)
          );

          const wallet = await tx.wallet.upsert({
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

                paymentMode: 'WALLET',
                recipientPaymentMode: draft.paymentMode,
                codAmount:
                  draft.paymentMode === 'COD'
                    ? draft.codAmount
                    : null,

                codCollectionStatus:
                  draft.paymentMode === 'COD' ? 'PENDING' : null,

                codRemittanceStatus:
                  draft.paymentMode === 'COD' ? 'PENDING' : null,

                childAccountId: draft.childAccountId || null,
              },
            });

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

            bookedShipments.push({
              ...shipment,
              shippingCharge: amount.toFixed(2),
            });
          }

          const updatedWallet = await tx.wallet.findUnique({
            where: { userId: customerId },
          });

          return {
            shipments: bookedShipments,
            totalAmount,
            walletBalance: updatedWallet.balance.toString(),
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
          paymentMode: 'WALLET',
          amount: result.totalAmount,
          walletBalance: result.walletBalance,
          status: 'SUCCESS',
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
     const customer = await prisma.user.findUnique({
  where: { id: customerId },
  select: {
    name: true,
    email: true,
    companyName: true,
    gstNumber: true,
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
const grossCharge = Number(charge.total);
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
          // Calculate COD charges
const isCod = draft.paymentMode === 'COD';
const codAmount = isCod ? Number(draft.codAmount || 0) : null;

if (isCod && (!Number.isFinite(codAmount) || codAmount <= 0)) {
  throw new Error('Please enter a valid COD amount.');
}

const codCharge = isCod
  ? (codAmount <= 1500 ? 30 : Number((codAmount * 0.015).toFixed(2)))
  : null;

const codNetAmount = isCod
  ? Number((codAmount - codCharge).toFixed(2))
  : null;

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

// ShipNext shipping-charge payment
paymentMode: 'WALLET',

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
const invoiceNumber = `SN-INV-${Date.now()}-${crypto
  .randomBytes(4)
  .toString('hex')
  .toUpperCase()}`;

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

    paymentStatus: 'PAID',
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
          const updatedWallet = await tx.wallet.findUnique({
            where: {
              id: wallet.id,
            },
          });

          return {
  shipment,
  invoice,
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
        invoice: result.invoice,
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
