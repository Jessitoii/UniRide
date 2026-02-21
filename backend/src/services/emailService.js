const { google } = require('googleapis');

// Initialize the OAuth2 client
const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

/**
 * Send an email using the Gmail API.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email body in HTML format
 * @returns {Promise<void>}
 */
const sendEmail = async (to, subject, html) => {
    try {
        // Construct MIME-formatted email string
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const messageParts = [
            `From: "UniRide Destek" <${process.env.EMAIL_USER}>`,
            `To: ${to}`,
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `Subject: ${utf8Subject}`,
            '',
            html
        ];
        const message = messageParts.join('\n');

        // Convert the string into a Base64URL encoded format
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // Send email via Gmail API
        const response = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });

        console.log(`[EmailService] Email sent to: ${to} | Status: ${response.status} ${response.statusText}`);
    } catch (error) {
        console.error('[EmailService] Failed to send email:', error);

        // Ensure specific error logging for token expiration or permission denials
        if (error.response && error.response.data) {
            console.error('[EmailService] Error details (Possible token expiration or permission denial):', JSON.stringify(error.response.data, null, 2));
        }

        throw error;
    }
};

module.exports = { sendEmail };
