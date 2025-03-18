// services/notificationService.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const createNotification = async (userId, type, title, message, relatedId = null, refModel = null) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        isRead: false,
        relatedId,
        refModel
      }
    });
    
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    throw err;
  }
};

// For ride-related notifications
const createRideNotification = async (userId, title, message, postId) => {
  return createNotification(userId, 'ride', title, message, postId, 'Post');
};

// For match-related notifications
const createMatchNotification = async (userId, title, message, matchedUserId) => {
  return createNotification(userId, 'match', title, message, matchedUserId, 'User');
};

// For payment-related notifications
const createPaymentNotification = async (userId, title, message, paymentId) => {
  return createNotification(userId, 'payment', title, message, paymentId, 'Payment');
};

// For system notifications
const createSystemNotification = async (userId, title, message) => {
  return createNotification(userId, 'system', title, message);
};

module.exports = {
  createRideNotification,
  createMatchNotification,
  createPaymentNotification,
  createSystemNotification,
  createNotification
};