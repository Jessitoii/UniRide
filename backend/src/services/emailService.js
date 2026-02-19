const nodemailer = require('nodemailer');

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
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
