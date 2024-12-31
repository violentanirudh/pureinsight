const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: process.env.MAIL_PORT || 587,
  secure: process.env.MAIL_PORT == 465, // true for SSL, false for TLS
  auth: {
    user: process.env.MAIL_USER || 'meniyadhruvil@gmail.com',
    pass: process.env.MAIL_PASS || 'epeh kgdl lyll zerl',
  },
});

// Function to send verification email
const sendVerificationEmail = async (userEmail, verificationToken) => {
  const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/auth/verify-email/${verificationToken}`;

  const mailOptions = {
    from: `"Your App Name" <${process.env.MAIL_USER || 'your-email@gmail.com'}>`,
    to: userEmail,
    subject: 'Test Email Verification',
    text: `Please click the following link to verify your email: ${verificationUrl}`,
    html: `<p>Please click the following link to verify your email:</p><a href="${verificationUrl}">Verify Email</a>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${userEmail}: ${info.response}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Unable to send verification email.');
  }
};

module.exports = { sendVerificationEmail };
