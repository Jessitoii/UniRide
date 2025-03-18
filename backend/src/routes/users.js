const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth'); // Import the auth middleware
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createNotification } = require('../services/notificationService');
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/profilePhotos');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.userId}${ext}`);
  },
});

const upload = multer({ storage: storage });

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.userId; // Get userId from the decoded token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: true,
        car: true,   // Include car relation
        wallet: true, // Include wallet relation
        interestedIn: {
          include: {
            user: true,
            post: true,
          },
        }, // Include interestedIn relation
        matchedPosts: {
          include: {
            user: true,
            matchedUser: true,
          },
        }, // Include matchedPosts relation
        reviewMade: true, // Include reviewMade relation
        reviewReceived: true, // Include reviewReceived relation
        messagesSent: true, // Include messagesSent relation
        messagesReceived: true, // Include messagesReceived relation
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile with photo
router.put('/profile', auth, upload.single('profilePhoto'), async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { password, posts, ...updateData } = req.body;
    const { id, createdAt, ...validUpdateData } = updateData;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: validUpdateData,
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        gender: true,
        birthDate: true,
        university: true,
        faculty: true,
        createdAt: true,
        bio: true,
        stars: true,
        reviewReceived: true
      },
    });

    // Create a notification for profile update
    await createNotification(
      userId,
      'system',
      'Profil Güncellendi',
      'Profil bilgileriniz başarıyla güncellendi.',
      updatedUser.id,
      'User'
    );

    // If the profile photo was updated, create a specific notification
    if (req.file) {
      await createNotification(
        userId,
        'system',
        'Profil Fotoğrafı Güncellendi',
        'Profil fotoğrafınız başarıyla yüklendi.',
        updatedUser.id,
        'User'
      );
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add an endpoint to create a welcome notification for new users
router.post('/welcome-notification', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    await createNotification(
      userId,
      'system',
      'KampusTaxi\'ye Hoş Geldiniz',
      'KampusTaxi\'ye hoş geldiniz! Uygulamayı kullanmaya başlamak için profil bilgilerinizi güncelleyin ve yolculuklara göz atın.',
      userId,
      'User'
    );
    
    res.status(200).json({ message: 'Welcome notification created' });
  } catch (error) {
    console.error('Welcome notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve profile photo
router.get('/profilePhoto/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const uploadPath = path.join(__dirname, '../../uploads/profilePhotos');
    const files = fs.readdirSync(uploadPath);
    const file = files.find(f => f.startsWith(userId));

    if (!file) {
      res.sendFile(path.join(uploadPath, 'default.jpg'));
      return;
    }

    res.sendFile(path.join(uploadPath, file));
  } catch (error) {
    console.error('Error fetching profile photo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        gender: true,
        birthDate: true,
        university: true,
        faculty: true,
        createdAt: true,
        bio: true,
        stars: true,
        reviewReceived: true,
        posts: true,
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 