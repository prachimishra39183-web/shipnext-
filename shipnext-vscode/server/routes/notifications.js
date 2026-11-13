
const express = require('express');
const prisma = require('../prisma');
const {
  authenticateToken,
  authorizeRole,
} = require('../middleware/auth');

const router = express.Router();

// GET CUSTOMER NOTIFICATIONS
router.get(
  '/me',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId: req.user.userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      });

      const unreadCount = notifications.filter(
        (notification) => !notification.isRead
      ).length;

      return res.json({
        success: true,
        unreadCount,
        notifications,
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to retrieve notifications.',
      });
    }
  }
);

// MARK ONE NOTIFICATION AS READ
router.patch(
  '/:id/read',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          id: req.params.id,
          userId: req.user.userId,
        },
        data: {
          isRead: true,
        },
      });

      if (result.count === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found.',
        });
      }

      return res.json({
        success: true,
        message: 'Notification marked as read.',
      });
    } catch (error) {
      console.error('Mark notification read error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to update notification.',
      });
    }
  }
);

// MARK ALL NOTIFICATIONS AS READ
router.patch(
  '/read-all',
  authenticateToken,
  authorizeRole('CUSTOMER'),
  async (req, res) => {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: req.user.userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return res.json({
        success: true,
        message: 'All notifications marked as read.',
      });
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to update notifications.',
      });
    }
  }
);

module.exports = router;
