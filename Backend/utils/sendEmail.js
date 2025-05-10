//utils/sendEmail
const nodemailer = require('nodemailer');
const ErrorResponse = require('./errorResponse');

const sendEmail = async options => {
  //  Creating  the  transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // defining the email options
  const mailOptions = {
    from: 'STRIVE Store <no-reply@strivestore.com>',
    to: options.email,
    subject: options.subject,
    text: options.message

  };

  //sending the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;