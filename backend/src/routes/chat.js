const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Save a message
router.post('/messages', async (req, res) => {
  const { roomId, senderId, receiverId, text } = req.body;
  try {
    const message = await prisma.message.create({
      data: {
        roomId,
        senderId,
        receiverId,
        text,
      },
    });
    res.status(201).json(message);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Get messages for a room
router.get('/messages/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    const messages = await prisma.message.findMany({
      where: { roomId },
      orderBy: { timestamp: 'asc' },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    });

    // Filter out messages where receiver is null
    const filteredMessages = messages.filter(message => message.receiver !== null);

    res.json(filteredMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router; 