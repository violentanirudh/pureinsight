const express = require('express');
const User = require('../models/user'); // Import the User model
const { sendVerificationEmail } = require('../utils/mailer'); // Import mailer utility
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Use JWT for token generation
const crypto = require('crypto'); // To generate a verification token
const router = express.Router();

// Load environment variables
require('dotenv').config();

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role,email:user.email }, // Payload with user ID and role
    process.env.JWT_SECRET, // Secret key from .env file
    { expiresIn: '2h' } // Token expiration time
  );
};

// ===== Register User Route =====
router.post('/register', async (req, res) => {
  const { email, password, role = 'user' } = req.body; // Default role is 'user'

  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate a verification token for email verification
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create a new user with hashed password and verification token
    const user = new User({
      email,
      password,
      role,
      verificationToken,
      isVerified: false, // Ensure the user is not verified initially
    });

    // Save the user to the database
    await user.save();

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      message:
        'User registered successfully. Please check your email for verification.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// ===== Verify Email Route =====
router.get('/verify-email/:token', async (req, res) => {
  const { token } = req.params;

  try {
    // Find the user with the verification token
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Set user as verified and remove the verification token
    user.isVerified = true;
    user.verificationToken = undefined; // Token is no longer needed after verification

    // Save the updated user to the database
    await user.save();

    res.status(200).json({ message: 'Email successfully verified' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during email verification' });
  }
});

// ===== Login Route =====
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate request body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find the user by email and explicitly include the password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if passwords match
    const verification = await user.isPasswordMatch(password, user.password);
    if (!verification) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email first' });
    }

    // Generate JWT token for authenticated users
    const token = generateToken(user);

    // Set JWT as HTTP-only cookie (secure in production)
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production only
      maxAge: 2 * 60 * 60 * 1000, // Cookie expiration time (2 hours)
      sameSite: 'strict',
    });

    res.status(200).json({
      message: 'Login successful',
      role: user.role,
      token,
      id: user._id,
      email: user.email,
    });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ===== Logout Route =====
// Clears the JWT cookie from the browser when logging out.
router.get('/logout', (req, res) => {
  res.clearCookie('jwt'); // Clear the JWT cookie from the browser
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;
