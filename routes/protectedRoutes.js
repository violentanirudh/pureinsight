const express = require('express');
const router = express.Router();
const { 
    scan
} = require('../controllers/authController');
const { protect } = require('../middlewares/authorization')

// Auth routes
router.get('/scan', protect('user', 'admin'), scan);

module.exports = router;
