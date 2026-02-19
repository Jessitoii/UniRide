// routes/notifications.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();


// Get all notifications for current user
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Mark notification as read
router.post('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Safety check for valid ObjectID length/format
    if (!id || id === 'undefined' || id.length !== 24) {
      return res.status(400).json({ msg: 'Invalid notification ID' });
    }

    const notification = await prisma.notification.findUnique({
      where: {
        id: id
      }
    });

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    // Check user owns the notification
    if (notification.userId !== req.user.userId) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json(updatedNotification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Mark all notifications as read
router.post('/read-all', auth, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({ msg: 'All notifications marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;