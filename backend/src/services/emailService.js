const nodemailer = require('nodemailer');

// Configure nodemailer
// Locate your transport initialization
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Mandatory for STARTTLS on Port 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Must be the 16-character Google App Password
    },
    tls: {
        // Hardens the connection against certain cloud network instabilities
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
    }
});

/**
 * Send an email using the configured transporter.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email body in HTML format
 * @returns {Promise<void>}
 */
const sendEmail = async (to, subject, html) => {
    const mailOptions = {
        from: `"KampüsRoute Destek" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[EmailService] Email sent to: ${to}`);
    } catch (error) {
        console.error('[EmailService] Failed to send email:', error);
        throw error;
    }
};

module.exports = { sendEmail };
