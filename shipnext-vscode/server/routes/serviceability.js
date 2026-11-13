
const express = require('express');
const prisma = require('../prisma');
const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

const router = express.Router();

const VALID_MODES = [
  'EXPRESS_AIR',
  'NORMAL_AIR',
  'EXPRESS_SURFACE',
  'NORMAL_SURFACE',
];

function validPincode(pin) {
  return /^\d{6}$/.test(String(pin || ''));
}

// PUBLIC: Check serviceability and automatically allocate a mode
router.post('/check', async (req, res) => {
  try {
    const { pickupPincode, deliveryPincode } = req.body;

    if (!validPincode(pickupPincode) || !validPincode(deliveryPincode)) {
      return res.status(400).json({
        success: false,
        message: 'Enter valid six-digit pickup and delivery PIN codes.',
      });
    }

    const availableModes = await prisma.serviceabilityMode.findMany({
      where: {
        pickupPincode,
        deliveryPincode,
        isActive: true,
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    if (availableModes.length === 0) {
      return res.status(404).json({
        success: false,
        serviceable: false,
        message: 'No shipping mode is currently available for this route.',
      });
    }

    const assignedMode = availableModes[0];

    return res.json({
      success: true,
      serviceable: true,
      assignedMode: assignedMode.mode,
      availableModes: availableModes.map((item) => ({
        mode: item.mode,
        priority: item.priority,
      })),
      message: 'Shipping mode allocated successfully.',
    });
  } catch (error) {
    console.error('Serviceability check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to check serviceability.',
    });
  }
});

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
