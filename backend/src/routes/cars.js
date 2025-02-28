const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/cars');
  },
  filename: (req, file, cb) => {
    const carId = req.params.id;
    cb(null, `${carId}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// Create or update a car
router.post('/', auth, async (req, res) => {
  try {
    const { brand, model } = req.body;
    const userId = req.user.userId;

    let car = await prisma.car.findUnique({
      where: { userId },
    });

    if (car) {
      car = await prisma.car.update({
        where: { userId },
        data: { brand, model },
      });
    } else {
      car = await prisma.car.create({
        data: { brand, model, userId },
      });
    }

    res.json(car);
  } catch (error) {
    console.error('Error creating/updating car:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload car photo
router.post('/:id/photo', auth, upload.single('photo'), async (req, res) => {
  try {
    const carId = req.params.id;

    res.json({ message: 'Photo uploaded successfully' });
  } catch (error) {
    console.error('Error uploading car photo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch car information for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const car = await prisma.car.findUnique({
      where: { userId },
    });

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    res.json(car);
  } catch (error) {
    console.error('Error fetching car information:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 