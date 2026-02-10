const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { createNotification } = require('../services/notificationService');

const prisma = new PrismaClient();


// Fetch wallet balance
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: { transactions: true },
    });

    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    res.json(wallet);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove Papara and deposit/withdraw logic

// Get wallet summary for the current user
router.get('/summary', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    // As driver: rides where user is the driver
    const driverRides = await prisma.post.findMany({
      where: { userId },
      select: { id: true, fare: true, datetimeStart: true, destinationUniversity: true, destinationFaculty: true, sourceAddress: true }
    });
    // As passenger: rides where user is a matchedUser
    const passengerRides = await prisma.post.findMany({
      where: { matchedUserId: userId },
      select: { id: true, fare: true, datetimeStart: true, destinationUniversity: true, destinationFaculty: true, sourceAddress: true }
    });
    const totalEarned = driverRides.reduce((sum, ride) => sum + (ride.fare || 0), 0);
    const totalSpent = passengerRides.reduce((sum, ride) => sum + (ride.fare || 0), 0);
    res.json({
      totalEarned,
      totalSpent,
      rides: [
        ...driverRides.map(r => ({ ...r, role: 'driver' })),
        ...passengerRides.map(r => ({ ...r, role: 'passenger' }))
      ]
    });
  } catch (error) {
    console.error('Error fetching wallet summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user's IBAN
router.get('/iban', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ iban: user.iban || '' });
  } catch (error) {
    console.error('Error fetching IBAN:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update current user's IBAN
router.post('/iban', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { iban } = req.body;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { iban },
    });
    res.json({ iban: user.iban });
  } catch (error) {
    console.error('Error updating IBAN:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark a ride as paid (driver and passenger wallet update)
router.post('/mark-paid', auth, async (req, res) => {
  try {
    const { postId, driverId, passengerId, amount } = req.body;
    if (!postId || !driverId || !passengerId || !amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Update driver's earnings
    await prisma.wallet.update({
      where: { userId: driverId },
      data: { earningsBalance: { increment: amount } },
    });
    // Update passenger's spent (use depositBalance for now)
    await prisma.wallet.update({
      where: { userId: passengerId },
      data: { depositBalance: { decrement: amount } },
    });
    // Optionally, you could add a transaction record here
    res.json({ message: 'Payment marked as complete' });
  } catch (error) {
    console.error('Error marking ride as paid:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 