const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // or mail.yourdomain.com
  port: 587,
  secure: false, // false for port 587, true for port 465
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Use an App Password, not your normal password
  },
  connectionTimeout: 10000, // Timeout after 10s instead of hanging
});

module.exports= transporter;