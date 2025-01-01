const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { detectTextHandler, analyzeTextHandler } = require('../controllers/processImageController');
const { protect } = require('../middlewares/authorization');
const User = require('../models/User');

// Route to detect text from an image
router.post('/detect-text', protect('user', 'admin'), upload.array('images', 4), detectTextHandler);

// Route to analyze detected text
router.post('/analyze-text', protect('user', 'admin'), analyzeTextHandler);

module.exports = router;
