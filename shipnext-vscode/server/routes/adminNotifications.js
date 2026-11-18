
const express = require('express');
const prisma = require('../prisma');
const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

const router = express.Router();

// All routes are restricted to admins
router.use(authenticateToken, authorizeRole('ADMIN'));

// GET ALL NOTIFICATIONS
router.get('/', async (req, res) => {
  try {
    const notifications = await prisma.adminNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.adminNotification.count({
      where: { isRead: false },
    });

    res.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error('Admin notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to fetch notifications',
    });
  }
});

// MARK ONE NOTIFICATION AS READ
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await prisma.adminNotification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  }
});

// MARK ALL NOTIFICATIONS AS READ
router.patch('/read-all', async (req, res) => {
  try {
    await prisma.adminNotification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to update notifications',
    });
  }
});

module.exports = router;
