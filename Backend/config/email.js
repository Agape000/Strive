
//config/email.js
const nodemailer = require('nodemailer');
const ErrorResponse = require('../utils/errorResponse');

// Creating a  reusable transporter using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === '465', // treu for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // 4 self-signed certificates
  }
});

// Verifying connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error verifying email transporter:', error);
  } else {
    console.log('Server is ready to take our messages');
  }
});

// Sendgn  email fucntion
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `STRIVE Store <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new ErrorResponse('Email could not be sent', 500);
  }
};

// Email templates
const emailTemplates = {
  verification: (name, code) => ({
    subject: 'Email Verification - STRIVE Store',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d3748;">Hello ${name},</h2>
        <p>Thank you for registering with STRIVE Store. Please verify your email address to complete your registration.</p>
        <p>Your verification code is:</p>
        <div style="background: #f7fafc; border: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 24px; font-weight: bold; margin: 24px 0; color: #2d3748;">
          ${code}
        </div>
        <p>This code will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The STRIVE Team</p>
      </div>
    `
  }),
  orderConfirmation: (name, orderId, amount) => ({
    subject: `Order Confirmation #${orderId} - STRIVE Store`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d3748;">Hello ${name},</h2>
        <p>Thank you for your order at STRIVE Store!</p>
        <p>Your order <strong>#${orderId}</strong> has been received and is being processed.</p>
        <p>Total amount: <strong>$${amount.toFixed(2)}</strong></p>
        <p>You'll receive another email when your order ships.</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>The STRIVE Team</p>
      </div>
    `
  }),
  paymentReceived: (name, orderId, amount) => ({
    subject: `Payment Received #${orderId} - STRIVE Store`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d3748;">Hello ${name},</h2>
        <p>We've received your payment for order <strong>#${orderId}</strong>.</p>
        <p>Amount paid: <strong>$${amount.toFixed(2)}</strong></p>
        <p>Your order is now being processed and will be shipped soon.</p>
        <p>You can track your order status in your account dashboard.</p>
        <p>Best regards,<br>The STRIVE Team</p>
      </div>
    `
  })
};

module.exports = {
  sendEmail,
  emailTemplates
};