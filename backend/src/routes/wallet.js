const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const Papara = require('papara');
const { createNotification } = require('../services/notificationService');

const prisma = new PrismaClient();

const papara = new Papara({
  apiKey: process.env.PAPARA_API_KEY,
  environment: Papara.Environment.SANDBOX, // Use Papara.Environment.PRODUCTION for production
});

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

// Deposit money via Papara
router.post('/deposit', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.userId;

    // Papara Send Payment API logic
    const paymentRequest = {
      amount: amount,
      currency: 'TRY',
      description: 'Deposit to wallet',
      referenceId: `deposit-${userId}-${Date.now()}`,
    };

    const result = await papara.sendPayment(paymentRequest);

    if (!result || result.status !== 'success') {
      console.error('Papara payment error:', result.errorMessage);
      return res.status(400).json({ message: 'Payment failed' });
    }

    // Update wallet balance
    const wallet = await prisma.wallet.update({
      where: { userId },
      data: {
        depositBalance: { increment: amount },
        transactions: {
          create: { type: 'deposit', amount, referenceId: paymentRequest.referenceId },
        },
      },
    });

    // Create a notification for the user
    await createNotification(
      userId,
      'payment',
      'Para Yükleme Başarılı',
      `Hesabınıza ${amount}₺ tutarında para yükleme işlemi başarıyla gerçekleştirildi.`,
      paymentRequest.referenceId,
      'Transaction'
    );

    res.json(wallet);
  } catch (error) {
    console.error('Error depositing money:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Withdraw money to bank account via Papara
router.post('/withdraw', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.userId;

    const wallet = await prisma.wallet.findUnique({ where: { userId } });

    if (wallet.earningsBalance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Papara Bank Transfer API logic
    const transferRequest = {
      amount: amount,
      currency: 'TRY',
      description: 'Withdraw from wallet',
      referenceId: `withdraw-${userId}-${Date.now()}`,
    };

    const result = await papara.withdraw(transferRequest);

    if (!result || result.status !== 'success') {
      console.error('Papara withdrawal error:', result.errorMessage);
      return res.status(400).json({ message: 'Withdrawal failed' });
    }

    // Update wallet balance
    const updatedWallet = await prisma.wallet.update({
      where: { userId },
      data: {
        earningsBalance: { decrement: amount },
        transactions: {
          create: { type: 'withdraw', amount, referenceId: transferRequest.referenceId },
        },
      },
    });

    // Create a notification for the user
    await createNotification(
      userId,
      'payment',
      'Para Çekme İşlemi Başarılı',
      `Hesabınızdan ${amount}₺ tutarında para çekme işlemi başarıyla gerçekleştirildi.`,
      transferRequest.referenceId,
      'Transaction'
    );

    res.json(updatedWallet);
  } catch (error) {
    console.error('Error withdrawing money:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 