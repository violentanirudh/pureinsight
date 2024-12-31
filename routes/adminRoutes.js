const express = require('express');
const { authenticateUser, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

// Admin-only route
router.get('/admin-dashboard', authenticateUser, authorizeRole('admin'), (req, res) => {
  res.status(200).json({ message: 'Welcome to the admin dashboard' });
});

// User-only route
router.get('/user-dashboard', authenticateUser, authorizeRole('user'), (req, res) => {
  res.status(200).json({ message: 'Welcome to your dashboard', user: req.user });
});

module.exports = router;
