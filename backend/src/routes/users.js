const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth'); // Import the auth middleware
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createNotification } = require('../services/notificationService');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const { v4: uuidv4 } = require('uuid');

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
    // Use UUID to prevent caching issues
    cb(null, `${req.user.userId}-${uuidv4()}${ext}`);
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
        posts: {
          include: {
            interestedUsers: {
              include: {
                user: true
              }
            }
          }
        },

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

    res.json({
      ...user,
      hasCustomPhoto: user.hasCustomPhoto ?? false
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile photo
router.patch('/profile-photo', auth, upload.single('profilePhoto'), async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Clean up old photos for this user
    const uploadPath = path.join(__dirname, '../../uploads/profilePhotos');
    const files = fs.readdirSync(uploadPath);
    const oldFiles = files.filter(f => f.startsWith(userId) && f !== req.file.filename);

    oldFiles.forEach(file => {
      fs.unlinkSync(path.join(uploadPath, file));
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        hasCustomPhoto: true
      },
      select: { id: true, name: true, hasCustomPhoto: true }
    });

    await createNotification(
      userId,
      'system',
      'Profil Fotoğrafı Güncellendi',
      'Profil fotoğrafınız başarıyla yüklendi.',
      updatedUser.id,
      'User'
    );

    res.json({ message: 'Profile photo updated', filename: req.file.filename });

  } catch (error) {
    console.error('Update profile photo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile (text data)
router.put('/profile', auth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { name, surname, gender, birthDate, university, faculty, bio } = req.body;

    // Explicitly construct update object to avoid Prisma errors with extra fields
    const updateData = {};
    if (name) updateData.name = name;
    if (surname) updateData.surname = surname;
    if (gender) updateData.gender = gender;
    if (university) updateData.university = university;
    if (faculty) updateData.faculty = faculty;
    if (bio !== undefined) updateData.bio = bio;

    if (birthDate) {
      try {
        updateData.birthDate = new Date(birthDate);
      } catch (e) {
        console.error('Invalid birthDate format:', birthDate);
      }
    }

    console.log('Updating user:', userId, 'with:', updateData);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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
      'KampüsRoute\'a Hoş Geldiniz',
      'KampüsRoute\'a hoş geldiniz! Uygulamayı kullanmaya başlamak için profil bilgilerinizi güncelleyin ve yolculuklara göz atın.',
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

    if (!fs.existsSync(uploadPath)) {
      return res.status(404).send('Photo not found');
    }

    const files = fs.readdirSync(uploadPath);
    const file = files.find(f => f.startsWith(userId));

    if (!file) {
      return res.status(404).send('Photo not found');
    }

    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(uploadPath, file));
  } catch (error) {
    console.error('Error fetching profile photo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/travel-history
router.get('/travel-history', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();

    // Condition for terminal state: Date is past OR Status is COMPLETED/CANCELLED
    const terminalCondition = {
      OR: [
        { datetimeEnd: { lt: now } },
        { status: 'COMPLETED' },
        { status: 'CANCELLED' } // Include cancelled rides
      ]
    };

    // 1. Fetch "Rides I Drove"
    const driverHistory = await prisma.post.findMany({
      where: {
        userId: userId,
        ...terminalCondition
      },
      include: {
        user: { select: { id: true, name: true, surname: true, hasCustomPhoto: true, stars: true } },
        matchedUser: { select: { id: true, name: true, surname: true, hasCustomPhoto: true, stars: true } },
        interestedUsers: { include: { user: true } }, // To show who applied
        reviews: true
      },
      orderBy: { datetimeStart: 'desc' }
    });

    // 2. Fetch "Rides I Joined" (Passenger)
    const passengerHistory = await prisma.post.findMany({
      where: {
        matchedUserId: userId,
        ...terminalCondition
      },
      include: {
        user: { select: { id: true, name: true, surname: true, hasCustomPhoto: true, stars: true } }, // Driver details
        reviews: true
      },
      orderBy: { datetimeStart: 'desc' }
    });

    // Helper to add 'hasBeenReviewed' flag
    const processHistory = (posts) => posts.map(post => {
      // Check if CURRENT USER has left a review for this post
      const hasReviewed = post.reviews.some(r => r.userId === userId);

      // Determine effective status
      let effectiveStatus = post.status;
      if (effectiveStatus === 'PENDING' || effectiveStatus === 'MATCHED') {
        // If status says active but time is past, show as Completed or Expired?
        // For now, if time is past, we can assume Completed if matched, or Expired if not.
        if (new Date(post.datetimeEnd) < now) {
          effectiveStatus = post.matchedUserId ? 'COMPLETED' : 'EXPIRED';
        }
      }

      return {
        ...post,
        hasBeenReviewed: hasReviewed, // Frontend usage: if false, show "Rate" button
        effectiveStatus // Frontend usage: easier status logic
      };
    });

    res.json({
      driverHistory: processHistory(driverHistory),
      passengerHistory: processHistory(passengerHistory)
    });

  } catch (error) {
    console.error('Error fetching travel history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/travel-data
router.get('/travel-data', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();

    // Get current user's basic profile
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        stars: true,
        university: true,
        faculty: true,
      },
    });

    // Get posts where current user is matchedUser and date is in the future
    const matchedPosts = await prisma.post.findMany({
      where: {
        matchedUserId: userId,
        datetimeStart: { gt: now },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            stars: true,
          },
        },
        matchedUser: {
          select: {
            id: true,
            name: true,
            stars: true,
          },
        },
      },
    });

    // Get current user's own future posts
    const myActivePosts = await prisma.post.findMany({
      where: {
        userId: userId,
        datetimeStart: { gt: now },
      },
      include: {
        matchedUser: {
          select: {
            id: true,
            name: true,
            stars: true,
          },
        },
      },
    });

    let pendingPosts = [];
    try {
      // --- SQUAD MISSION: RELATIONAL BRIDGE IMPLEMENTATION ---

      // Step 1: Find all posts the user is interested in manually (Bridge)
      const myInterests = await prisma.interestedUser.findMany({
        where: { userId: userId },
        select: { postId: true }
      });

      // Step 2: Extract Post IDs from the bridge table
      const interestedPostIds = myInterests.map(interest => interest.postId);

      // Step 3: Fetch the actual posts using the IDs, ensuring they are unmatched and active
      pendingPosts = await prisma.post.findMany({
        where: {
          id: { in: interestedPostIds },
          OR: [
            { matchedUserId: null },
            { matchedUserId: "" },
            { matchedUserId: { isSet: false } }
          ],
          userId: { not: userId }, // Exclude own posts
          datetimeStart: { gt: now }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              stars: true,
              hasCustomPhoto: true,
            }
          },
          interestedUsers: true
        }
      });

      console.log(`[TravelData] DEBUG: userId=${userId}`);
      console.log(`[TravelData] Found ${myInterests.length} interest entries.`);
      console.log(`[TravelData] User ${userId} - Pending Posts (Hydrated): ${pendingPosts.length}`);

    } catch (e) {
      console.error("[TravelData] Pending posts query failed:", e);
      pendingPosts = [];
    }

    res.json({
      profile,
      matchedPosts,
      myActivePosts,
      pendingPosts,
    });
  } catch (error) {
    console.error('Error in /api/users/travel-data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get User Shortcuts
router.get('/shortcuts', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const shortcuts = await prisma.shortcut.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(shortcuts);
  } catch (error) {
    console.error('Get shortcuts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create Shortcut
router.post('/shortcuts', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { label, address, latitude, longitude } = req.body;

    if (!label || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const shortcut = await prisma.shortcut.create({
      data: {
        userId,
        label,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      }
    });

    res.status(201).json(shortcut);
  } catch (error) {
    console.error('Create shortcut error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Shortcut
router.delete('/shortcuts/:id', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const shortcut = await prisma.shortcut.findUnique({
      where: { id }
    });

    if (!shortcut) {
      return res.status(404).json({ message: 'Shortcut not found' });
    }

    if (shortcut.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await prisma.shortcut.delete({
      where: { id }
    });

    res.json({ message: 'Shortcut deleted' });
  } catch (error) {
    console.error('Delete shortcut error:', error);
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
        reviewReceived: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                surname: true,
                hasCustomPhoto: true
              }
            } // Include reviewer details
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        car: true, // Include car details
        posts: true,
        hasCustomPhoto: true,
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

// Update user settings (SettingsScreen.tsx)
router.post('/update', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      email,
      password,
      birthDate,
      emailNotifications,
      pushNotifications,
      appAlerts,
      locationFeatures,
      locationAccess
    } = req.body;

    const updateData = {};
    if (email) updateData.email = email;
    if (birthDate) updateData.birthDate = new Date(birthDate);

    // Boolean settings fields
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined) updateData.pushNotifications = pushNotifications;
    if (req.body.notificationsEnabled !== undefined) updateData.notificationsEnabled = req.body.notificationsEnabled;
    if (appAlerts !== undefined) updateData.appAlerts = appAlerts;
    if (locationFeatures !== undefined) updateData.locationFeatures = locationFeatures;
    if (locationAccess !== undefined) updateData.locationAccess = locationAccess;

    // Handle password update - REMOVE THIS BLOCK as we are moving to a dedicated endpoint
    // if (password) {
    //   const salt = await bcrypt.genSalt(10);
    //   updateData.password = await bcrypt.hash(password, salt);
    // }

    // Wallet-ectomy check: Ensure no wallet fields are processed
    const forbiddenFields = ['wallet', 'balance', 'credit', 'payment', 'commission'];
    forbiddenFields.forEach(field => {
      if (req.body[field] !== undefined) {
        console.warn(`Attempted to update forbidden field ${field} on user ${userId}`);
        delete req.body[field];
      }
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        emailNotifications: true,
        pushNotifications: true,
        notificationsEnabled: true,
        appAlerts: true,
        locationFeatures: true,
        locationAccess: true,
      }
    });

    await createNotification(
      userId,
      'system',
      'Ayarlar Güncellendi',
      'Hesap ayarlarınız başarıyla güncellendi.',
      userId,
      'User'
    );

    res.json(updatedUser);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error during update' });
  }
});

// Change Password
router.patch('/change-password', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Eski ve yeni şifre gereklidir.' });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Eski şifre hatalı.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    await createNotification(
      userId,
      'system',
      'Şifre Değiştirildi',
      'Şifreniz başarıyla değiştirildi.',
      userId,
      'User'
    );

    res.json({ message: 'Şifreniz başarıyla değiştirildi.' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

// Send validation code for email change
router.post('/sendValidationCode', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const validationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60000); // 15 minutes

    await prisma.validationCode.create({
      data: {
        email,
        code: validationCode,
        expiresAt
      }
    });

    // In a real app, send the email here. For now, we just return success.
    console.log(`Validation code for ${email}: ${validationCode}`);

    res.json({ message: 'Validation code sent' });
  } catch (error) {
    console.error('Send validation code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify email with validation code
router.post('/verifyEmail', async (req, res) => {
  try {
    const { email, validationCode } = req.body;

    const record = await prisma.validationCode.findFirst({
      where: {
        email,
        code: validationCode,
        expiresAt: { gt: new Date() }
      }
    });

    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired validation code' });
    }

    // Delete the code after verification
    await prisma.validationCode.delete({
      where: { id: record.id }
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
