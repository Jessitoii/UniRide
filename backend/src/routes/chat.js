const express = require('express');

module.exports = (io) => {
  const router = express.Router();
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  // Save a message
  router.post('/messages', async (req, res) => {
    const { rideId, senderId, receiverId, text } = req.body;

    if (!rideId || !senderId || !receiverId || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // 1. Validate Match Status
      // Find the post associated with the rideId (assuming rideId is the Post ID)
      const post = await prisma.post.findUnique({
        where: { id: rideId },
      });

      if (!post) {
        return res.status(404).json({ error: 'Ride/Post not found' });
      }

      // Check if sender is either the creator (driver) or the matched user
      const isDriver = post.userId === senderId;
      const isPassenger = post.matchedUserId === senderId;

      if (!isDriver && !isPassenger) {
        return res.status(403).json({ error: 'You are not authorized to send messages in this ride' });
      }

      // Check if receiver is the other party
      if (isDriver && post.matchedUserId !== receiverId) {
        return res.status(403).json({ error: 'Receiver is not the matched passenger' });
      }
      if (isPassenger && post.userId !== receiverId) {
        return res.status(403).json({ error: 'Receiver is not the driver' });
      }

      // Check Block List
      const isBlocked = await prisma.blockList.findFirst({
        where: {
          OR: [
            { blockerId: receiverId, blockedId: senderId },
            { blockerId: senderId, blockedId: receiverId }
          ]
        }
      });

      if (isBlocked) {
        return res.status(403).json({ error: 'Cannot send message due to block' });
      }

      const message = await prisma.message.create({
        data: {
          rideId,
          senderId,
          receiverId,
          text,
          status: 'SENT' // explicit default
        },
        include: {
          sender: { select: { id: true, name: true, surname: true } },
          receiver: { select: { id: true, name: true, surname: true } }
        }
      });

      // Broadcast to room
      io.to(rideId).emit('receiveMessage', message);

      res.status(201).json(message);
    } catch (error) {
      console.error('Error saving message:', error);
      res.status(500).json({ error: 'Failed to save message' });
    }
  });

  // Get messages for a ride
  router.get('/messages/:rideId', async (req, res) => {
    const { rideId } = req.params;
    try {
      const messages = await prisma.message.findMany({
        where: { rideId },
        orderBy: { timestamp: 'asc' },
        include: {
          sender: { select: { id: true, name: true, surname: true } }, // Added surname
          receiver: { select: { id: true, name: true, surname: true } }, // Added surname
        },
      });

      // Filter out messages where receiver is null (shouldn't happen with strict checks but safe to keep)
      const filteredMessages = messages.filter(message => message.receiver !== null);

      res.json(filteredMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  // Block User
  router.post('/block', async (req, res) => {
    const { blockerId, blockedId } = req.body;
    try {
      const block = await prisma.blockList.create({
        data: {
          blockerId,
          blockedId
        }
      });
      res.status(201).json(block);
    } catch (error) {
      console.error('Error blocking user:', error);
      res.status(500).json({ error: 'Failed to block user' });
    }
  });

  return router;
};