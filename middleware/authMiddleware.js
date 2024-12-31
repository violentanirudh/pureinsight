const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Adjust the path to your User model

// Middleware to verify JWT and check authentication
const authenticateUser = async (req, res, next) => {
  try {
    console.log(" hello dhruvil")
    // Get the token from cookies or headers
    const token = req.cookies.jwt || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by ID and attach it to the request object
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user; // Attach user info to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check if the user has a specific role
const authorizeRole = (requiredRole) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Check if the user's role matches the required role
      if (req.user.role !== requiredRole) {
        return res.status(403).json({ message: 'You do not have permission to access this page' });
      }

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('Authorization error:', error.message);
      res.status(403).json({ message: 'Access denied' });
    }
  };
};

module.exports = { authenticateUser, authorizeRole };
