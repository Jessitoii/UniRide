const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configure nodemailer
const { sendEmail } = require('../services/emailService');

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
    const createdValidation = await prisma.validationCode.create({
      data: {
        email,
        code: validationCode,
        expiresAt: validationExpiry,
        tempPassword: hashedPassword,
        tempName: name,
        tempSurname: surname,
        tempGender: gender,
        tempBirthDate: new Date(birthDate),
        tempUniversity: university,
        tempFaculty: faculty,
      }
    });

    // Define high-level mail options
    const mailOptions = {
      from: `"UniRide Destek" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'UniRide: E-posta Doğrulama Kodu',
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">
          <div style="background-color: #FF007A; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">UniRide</h1>
          </div>
          <div style="padding: 30px;">
            <p style="color: #333333; font-size: 16px; line-height: 1.5;">Merhaba <strong>${name}</strong>,</p>
            <p style="color: #555555; font-size: 16px; line-height: 1.5;">UniRide topluluğuna katılmanız için son bir adım kaldı. Güvenliğiniz için aşağıdaki doğrulama kodunu kullanın:</p>
            <div style="background-color: #f8f9fa; border-radius: 6px; padding: 15px; margin: 25px 0; text-align: center;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2d3436;">${validationCode}</span>
            </div>
            <p style="color: #888888; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">Bu kod 30 dakika süreyle geçerlidir. Eğer bu işlemi siz yapmadıysanız, lütfen bu e-postayı görmezden gelin.</p>
            <p style="color: #aaaaaa; font-size: 12px; text-align: center; margin-top: 20px;">© 2026 UniRide. Tüm hakları saklıdır.</p>
          </div>
        </div>
      `
    };

    // Execute asynchronous transport
    try {
      await sendEmail(email, 'UniRide: E-posta Doğrulama Kodu', mailOptions.html);
      console.log(`[AuthService] Validation code sent to: ${email}`);
      res.json({ message: 'Validation code sent to email' });
    } catch (mailError) {
      console.error('[AuthService] SMTP Transport Failure:', mailError);

      // Rollback: Delete the created validation record
      await prisma.validationCode.delete({
        where: { id: createdValidation.id }
      });

      return res.status(500).json({ message: 'E-posta servisine erişilemedi. Lütfen daha sonra tekrar deneyiniz.' });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// Validate email route
router.post('/validate-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    // Verify validation code
    const validationRecord = await prisma.validationCode.findFirst({
      where: {
        email,
        code,
        expiresAt: { gt: new Date() }
      }
    });

    if (!validationRecord) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validationRecord.email,
        password: validationRecord.tempPassword,
        name: validationRecord.tempName,
        surname: validationRecord.tempSurname,
        gender: validationRecord.tempGender,
        birthDate: validationRecord.tempBirthDate,
        university: validationRecord.tempUniversity,
        faculty: validationRecord.tempFaculty,
      }
    });

    // Clean up
    await prisma.validationCode.deleteMany({
      where: { email }
    });

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

// Request data deletion route
router.post('/request-data-deletion', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // For security, don't reveal if user exists or not
      return res.json({ message: 'If an account exists for this email, a deletion request has been initiated.' });
    }

    // Mark as pending deletion
    await prisma.user.update({
      where: { email },
      data: { status: 'PENDING_DELETION' }
    });

    const deletionHtml = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">
        <div style="background-color: #FF007A; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">UniRide</h1>
        </div>
        <div style="padding: 30px;">
          <p style="color: #333333; font-size: 16px; line-height: 1.5;">Merhaba <strong>${user.name}</strong>,</p>
          <p style="color: #555555; font-size: 16px; line-height: 1.5;">Hesap silme ve veri temizleme talebinizi aldık. Bu işlem kapsamında tüm kişisel verileriniz, sürüş geçmişiniz ve mesajlarınız 30 gün içerisinde kalıcı olarak silinecektir.</p>
          <div style="background-color: #fff4f8; border-left: 4px solid #FF007A; padding: 15px; margin: 25px 0;">
            <p style="color: #FF007A; font-weight: bold; margin: 0;">Bu işlemi siz yapmadıysanız, lütfen hemen şifrenizi değiştirin ve bizimle iletişime geçin.</p>
          </div>
          <p style="color: #888888; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">Talebiniz işleme alınmıştır. Herhangi bir sorunuz olursa bu e-postayı yanıtlayabilirsiniz.</p>
          <p style="color: #aaaaaa; font-size: 12px; text-align: center; margin-top: 20px;">© 2026 UniRide. Tüm hakları saklıdır.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail(email, 'UniRide: Hesap Silme Talebi Alındı', deletionHtml);
      res.json({ message: 'If an account exists for this email, a deletion request has been initiated.' });
    } catch (mailError) {
      console.error('[AuthService] Deletion Email Failure:', mailError);
      // Even if email fails, we've marked the account. But we should notify the user.
      res.status(500).json({ message: 'Request recorded but confirmation email could not be sent. Please contact support.' });
    }
  } catch (error) {
    console.error('Data deletion request error:', error);
    res.status(500).json({ message: 'Server error during deletion request' });
  }
});

module.exports = router;