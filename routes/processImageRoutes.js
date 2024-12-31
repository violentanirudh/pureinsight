const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { detectTextHandler, analyzeTextHandler } = require('../controllers/processImageController');

// Route to detect text from an image
router.post('/detect-text', upload.array('images', 4), detectTextHandler);

// Route to analyze detected text
router.post('/analyze-text', analyzeTextHandler);

module.exports = router;
