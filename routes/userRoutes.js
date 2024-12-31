const express = require('express');
const { authenticateUser } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', authenticateUser,  (req, res) => {
  res.status(200).json({ message: 'Welcome to your profile', user: req.user });
});

module.exports = router;
