const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createNotification } = require('../services/notificationService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();


// Create a new review
router.post('/', auth, async (req, res) => {
  try {
    const { reviewedUserId, star, comment, postId } = req.body;
    const userId = req.user.userId;

    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        reviewedUserId,
        postId // Ensure this is unique per ride
      }
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this ride.' });
    }

    const review = await prisma.review.create({
      data: {
        userId,
        reviewedUserId,
        star,
        star,
        comment,
        postId
      },
      include: {
        user: true,
      },
    });

    // Notify the reviewed user about the new review
    const reviewer = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, surname: true }
    });

    if (reviewer) {
      // Create notification for the reviewed user
      await createNotification(
        reviewedUserId,
        'system',
        'Yeni Değerlendirme',
        `${reviewer.name} ${reviewer.surname} size ${star} yıldız değerlendirme yaptı.`,
        review.id,
        'Review'
      );
    }

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