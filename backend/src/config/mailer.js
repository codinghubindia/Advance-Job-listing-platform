const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Validate SMTP configuration
if (
  !process.env.SMTP_HOST ||
  !process.env.SMTP_PORT ||
  !process.env.SMTP_USER ||
  !process.env.SMTP_PASS
) {
  logger.error('Missing SMTP configuration in environment variables');
  throw new Error('SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS must be set');
}

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    logger.error('SMTP configuration error:', error);
  } else {
    logger.info('SMTP transporter is ready to send emails');
  }
});

/**
 * Send email
 * @param {object} mailOptions - Email options (to, subject, text, html)
 * @returns {Promise<object>} Send result
 */
const sendEmail = async (mailOptions) => {
  try {
    const defaultOptions = {
      from: `"ATS Score Engine" <${process.env.SMTP_USER}>`,
      ...mailOptions,
    };

    const info = await transporter.sendMail(defaultOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Email send failed:', error);
    throw error;
  }
};

module.exports = {
  transporter,
  sendEmail,
};
