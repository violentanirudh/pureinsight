const express = require('express');
const { sendVerificationEmail } = require('../utils/mailer'); // Adjust path as needed

const router = express.Router();

// Test email route
router.get('/test-email', async (req, res) => {
  try {
    const testEmail = 'dhruvilmeniya7@gmail.com'; // Replace with a valid recipient email address
    const testToken = '12345'; // Replace with a dummy token for testing purposes

    await sendVerificationEmail(testEmail, testToken);
    res.send('Test email sent successfully!');
  } catch (error) {
    console.error('Error in /test-email:', error);
    res.status(500).send('Failed to send test email');
  }
});

module.exports = router;

