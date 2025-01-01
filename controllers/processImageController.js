const asyncHandler = require('../middlewares/asyncHandler');
const { detectText, analyzeText } = require('../services/textProcessing');
const User = require('../models/User');
const Analysis = require('../models/Analysis');

// Function to validate EAN-13 code
function isValidEAN(ean) {
    if (!/^\d{13}$/.test(ean)) return false; // Ensure 13 numeric digits

    const digits = ean.split('').map(Number);
    const checkDigit = digits.pop(); // Extract last digit (checksum)

    const sum = digits.reduce((acc, digit, i) => acc + digit * (i % 2 === 0 ? 1 : 3), 0);
    const calculatedCheckDigit = (10 - (sum % 10)) % 10;

    return calculatedCheckDigit === checkDigit;
}

// Function to handle file uploads and detect text
const detectTextHandler = asyncHandler(async (req, res) => {
    // Ensure that req.user is provided
    if (!req.user) {
        throw new Error('User not authenticated. Please log in.');
    }

    const { ean } = req.body;

    // Validate that the EAN is provided and valid
    if (!ean || !isValidEAN(ean)) {
        return res.status(400).json({ error: 'A valid 13-digit EAN code is required.' });
    }

    // Validate that files are provided
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No image files provided.' });
    }

    // Validate that at most 4 files are uploaded
    if (req.files.length > 4) {
        return res.status(400).json({ error: 'You can upload a maximum of 4 images at a time.' });
    }

    try {
        // Extract buffers from uploaded files
        const imageBuffers = req.files.map((file) => file.buffer);

        // Detect text from the image buffers
        const responses = await detectText(imageBuffers);

        // Respond with the results
        res.json({ responses });
    } catch (error) {
        console.error('Error during text detection:', error);
        res.status(500).json({ error: 'Failed to process images. Please try again later.' });
    }
});

// Function to analyze detected text
const analyzeTextHandler = asyncHandler(async (req, res) => {
    const { detectedText, ean } = req.body;
  
    // Ensure that req.user is provided
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated. Please log in.' });
    }
  
    // Validate that the EAN is provided and valid
    if (!ean || !isValidEAN(ean)) {
      return res.status(400).json({ error: 'A valid 13-digit EAN code is required.' });
    }
  
    // Validate that detected text is provided
    if (!detectedText) {
      return res.status(400).json({ error: 'Detected text is required.' });
    }
  
    try {
      // Analyze the detected text
      const analysis = await analyzeText(detectedText);
  
      // Save to database
      const newAnalysis = await Analysis.create({
        user: req.user.id, // Retrieve user ID from req.user
        ean,
        text: detectedText,
        analysis,
      });
  
      res.status(201).json({
        analysis,
      });
    } catch (error) {
      console.error('Error during text analysis:', error);
      res.status(500).json({ error: 'Failed to analyze text. Please try again later.' });
    }
  });

// Export both handlers as named exports
module.exports = {
    detectTextHandler,
    analyzeTextHandler,
};
