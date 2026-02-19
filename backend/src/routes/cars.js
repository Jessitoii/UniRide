const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const prisma = new PrismaClient();

const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/cars');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
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

    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }

    const filename = req.file.filename;

    // Update car with photo path
    const updatedCar = await prisma.car.update({
      where: { id: carId },
      data: { photoPath: filename },
    });

    res.json({ message: 'Photo uploaded successfully', car: updatedCar });
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