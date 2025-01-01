const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../middlewares/asyncHandler');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

const signup = asyncHandler(async (req, res) => {

  const { 
    name, 
    email, 
    password,
    height,
    weight,
    allergies,
    illness,
    skin
  } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    height,
    weight,
    allergies: allergies || [],
    illness: illness || [],
    skin,
    credits: 100, // Starting credits
    verified: false
  });

  if (user) {
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        credits: user.credits,
        verified: user.verified
      }
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});


const signin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isPasswordMatch = await user.matchPassword(password);
  if (!isPasswordMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Generate token
  const token = generateToken(user._id);

  // Set JWT cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      credits: user.credits,
      verified: user.verified
    }
  });
});

// Logout controller
const logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
});
  
const scan = asyncHandler(async (req, res) => {
    res.render('scan');
});

module.exports = {
  signup,
  signin,
  logout,
  scan
};
