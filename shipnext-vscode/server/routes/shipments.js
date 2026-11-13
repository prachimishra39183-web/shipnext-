
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
      } = req.body;

      // Required field validation
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

      // Validate mobile numbers
      if (
        !/^[0-9]{10}$/.test(pickupPhone) ||
        !/^[0-9]{10}$/.test(deliveryPhone)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Both mobile numbers must contain 10 digits.',
        });
      }

      // Validate pincodes
      if (
        !/^[0-9]{6}$/.test(pickupPincode) ||
        !/^[0-9]{6}$/.test(deliveryPincode)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Both pincodes must contain 6 digits.',
        });
      }

      // Validate weight
      const weightKg = Number(weight);

      if (!Number.isFinite(weightKg) || weightKg < 0.5) {
        return res.status(400).json({
          success: false,
          message: 'Minimum parcel weight is 500 grams.',
        });
      }

      const weightGrams = Math.round(weightKg * 1000);

      const draft = await prisma.shipmentDraft.create({
        data: {
          customerId: req.user.userId,

          pickupName: pickupName.trim(),
          pickupPhone,
          pickupAddress: pickupAddress.trim(),
          pickupPincode,

          deliveryName: deliveryName.trim(),
          deliveryPhone,
          deliveryAddress: deliveryAddress.trim(),
          deliveryPincode,

          weightGrams,
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
