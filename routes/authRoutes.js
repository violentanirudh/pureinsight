const express = require('express');
const router = express.Router();
const { 
  signin, 
  signup, 
  logout,
} = require('../controllers/authController');
const asyncHandler = require('../middlewares/asyncHandler');

// Auth routes
router.post('/signin', signin);
router.post('/signup', signup);
router.get('/logout', logout);

module.exports = router;
