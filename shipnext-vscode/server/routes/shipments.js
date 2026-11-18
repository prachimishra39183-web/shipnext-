
const express = require('express');
const prisma = require('../prisma');
const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

const router = express.Router();

// SAVE SHIPMENT DETAILS AS A DRAFT

router.post(
  '/drafts',
  authenticateToken,
  authorizeRole('CUSTOMER'),
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

      if (!/^[0-9]{10}$/.test(String(pickupPhone)) ||
          !/^[0-9]{10}$/.test(String(deliveryPhone))) {
        return res.status(400).json({
          success: false,
          message: 'Both mobile numbers must contain 10 digits.',
        });
      }

      if (!/^[0-9]{6}$/.test(String(pickupPincode)) ||
          !/^[0-9]{6}$/.test(String(deliveryPincode))) {
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

        if (itemCategory === 'Other' &&
            (!itemName?.trim() || !itemDescription?.trim())) {
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

          shipmentType: normalizedType,
          itemCategory: normalizedType === 'NON_DOCUMENT' ? itemCategory : null,
          itemName: normalizedType === 'NON_DOCUMENT' && itemCategory === 'Other'
            ? itemName.trim()
            : null,
          itemDescription: normalizedType === 'NON_DOCUMENT' && itemCategory === 'Other'
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
          status: true,
          pickupPincode: true,
          deliveryPincode: true,
          weightGrams: true,
          shippingCharge: true,
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
module.exports = router;
