const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Create a new review
router.post('/', auth, async (req, res) => {
  try {
    const { reviewedUserId, star, comment } = req.body;
    const userId = req.user.userId;

    const review = await prisma.review.create({
      data: {
        userId,
        reviewedUserId,
        star,
        comment,
      },
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reviews for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { reviewedUserId: userId },
      include: {
        user: {
          select: {
            name: true,
            surname: true,
          }, 
        },
      },
    });

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 