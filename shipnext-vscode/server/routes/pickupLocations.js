
const express = require('express');
const prisma = require('../prisma');
const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, authorizeRole('CUSTOMER'));

const clean = (value) =>
  typeof value === 'string' ? value.trim() : '';

const validateLocation = (body) => {
  const required = [
    'locationName',
    'contactName',
    'phone',
    'address',
    'city',
    'state',
    'pincode',
  ];

  for (const field of required) {
    if (!clean(body[field])) {
      return `${field} is required.`;
    }
  }

  if (!/^[0-9]{10}$/.test(clean(body.phone))) {
    return 'Enter a valid 10-digit mobile number.';
  }

  if (!/^[0-9]{6}$/.test(clean(body.pincode))) {
    return 'Enter a valid 6-digit PIN code.';
  }

  return null;
};

const formatLocation = (location) => ({
  id: location.id,
  locationName: location.locationName,
  contactName: location.contactName,
  phone: location.phone,
  address: location.address,
  landmark: location.landmark || '',
  city: location.city,
  state: location.state,
  pincode: location.pincode,
  isDefault: location.isDefault,
  isActive: location.isActive,
  createdAt: location.createdAt,
});

// GET: CUSTOMER'S OWN PICKUP LOCATIONS
router.get('/', async (req, res) => {
  try {
    const locations = await prisma.pickupLocation.findMany({
      where: {
        userId: req.user.userId,
        isActive: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({
      success: true,
      locations: locations.map(formatLocation),
    });
  } catch (error) {
    console.error('Get pickup locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to load pickup locations.',
    });
  }
});

// CREATE PICKUP LOCATION
router.post('/', async (req, res) => {
  try {
    const validationError = validateLocation(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const {
      locationName,
      contactName,
      phone,
      address,
      landmark,
      city,
      state,
      pincode,
      isDefault,
    } = req.body;

    const userId = req.user.userId;

    const location = await prisma.$transaction(async (tx) => {
      const existingCount = await tx.pickupLocation.count({
        where: { userId, isActive: true },
      });

      const makeDefault = isDefault === true || existingCount === 0;

      if (makeDefault) {
        await tx.pickupLocation.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.pickupLocation.create({
        data: {
          userId,
          locationName: clean(locationName),
          contactName: clean(contactName),
          phone: clean(phone),
          address: clean(address),
          landmark: clean(landmark) || null,
          city: clean(city),
          state: clean(state),
          pincode: clean(pincode),
          isDefault: makeDefault,
        },
      });
    });

    res.status(201).json({
      success: true,
      message: 'Pickup location added successfully.',
      location: formatLocation(location),
    });
  } catch (error) {
    console.error('Create pickup location error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to add pickup location.',
    });
  }
});

// UPDATE PICKUP LOCATION
router.put('/:id', async (req, res) => {
  try {
    const validationError = validateLocation(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const userId = req.user.userId;
    const { id } = req.params;

    const existing = await prisma.pickupLocation.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Pickup location not found.',
      });
    }

    const {
      locationName,
      contactName,
      phone,
      address,
      landmark,
      city,
      state,
      pincode,
      isDefault,
    } = req.body;

    const location = await prisma.$transaction(async (tx) => {
      if (isDefault === true) {
        await tx.pickupLocation.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.pickupLocation.update({
        where: { id },
        data: {
          locationName: clean(locationName),
          contactName: clean(contactName),
          phone: clean(phone),
          address: clean(address),
          landmark: clean(landmark) || null,
          city: clean(city),
          state: clean(state),
          pincode: clean(pincode),
          ...(typeof isDefault === 'boolean'
            ? { isDefault }
            : {}),
        },
      });
    });

    res.json({
      success: true,
      message: 'Pickup location updated successfully.',
      location: formatLocation(location),
    });
  } catch (error) {
    console.error('Update pickup location error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to update pickup location.',
    });
  }
});

// SET DEFAULT PICKUP LOCATION
router.patch('/:id/default', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const existing = await prisma.pickupLocation.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Pickup location not found.',
      });
    }

    await prisma.$transaction([
      prisma.pickupLocation.updateMany({
        where: { userId },
        data: { isDefault: false },
      }),
      prisma.pickupLocation.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    res.json({
      success: true,
      message: 'Default pickup location updated.',
    });
  } catch (error) {
    console.error('Set default pickup location error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to set default location.',
    });
  }
});

// DELETE PICKUP LOCATION
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const existing = await prisma.pickupLocation.findFirst({
      where: { id, userId, isActive: true },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Pickup location not found.',
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.pickupLocation.delete({
        where: { id },
      });

      if (existing.isDefault) {
        const nextLocation = await tx.pickupLocation.findFirst({
          where: { userId, isActive: true },
          orderBy: { createdAt: 'asc' },
        });

        if (nextLocation) {
          await tx.pickupLocation.update({
            where: { id: nextLocation.id },
            data: { isDefault: true },
          });
        }
      }
    });

    res.json({
      success: true,
      message: 'Pickup location deleted successfully.',
    });
  } catch (error) {
    console.error('Delete pickup location error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to delete pickup location.',
    });
  }
});

module.exports = router;
