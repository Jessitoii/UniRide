const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate edu.tr email
    if (!email.endsWith('.edu.tr')) {
      return res.status(400).json({ message: 'Only .edu.tr email addresses are allowed' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword
      }
    });

    // Create token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, surname, gender, birthDate, university, faculty } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create validation code
    const validationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const validationExpiry = new Date(Date.now() + 30 * 60000); // 30 minutes

    // Create validation code record
    await prisma.validationCode.create({
      data: {
        email,
        code: validationCode,
        expiresAt: validationExpiry,
      }
    });

    // Store user data in session
    req.session.pendingUser = {
      email,
      password: hashedPassword,
      name,
      surname,
      gender,
      birthDate: new Date(birthDate),
      university,
      faculty,
    };

    // TODO: Send email with validation code

    res.json({ message: 'Validation code sent to email' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// Validate email route
router.post('/validate-email', async (req, res) => {
  try {
    const { code } = req.body;
    const pendingUser = req.session.pendingUser;

    if (!pendingUser) {
      return res.status(400).json({ message: 'No pending registration found' });
    }

    // Verify validation code
    const validationRecord = await prisma.validationCode.findFirst({
      where: {
        email: pendingUser.email,
        code,
        expiresAt: { gt: new Date() }
      }
    });

    if (!validationRecord) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    // Create user
    const user = await prisma.user.create({
      data: pendingUser
    });

    // Create a wallet for the user
    await prisma.wallet.create({
      data: {
        userId: user.id,
      },
    });

    // Clean up
    await prisma.validationCode.delete({
      where: { id: validationRecord.id }
    });
    delete req.session.pendingUser;

    // Create token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ 
      message: 'Email validated and user created successfully',
      token
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ message: 'Server error during validation' });
  }
});

module.exports = router; 