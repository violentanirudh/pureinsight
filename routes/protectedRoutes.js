const express = require('express');
const router = express.Router();
const { 
    scan
} = require('../controllers/authController');
const { protect } = require('../middlewares/authorization')
const Analysis = require('../models/Analysis');
const User = require('../models/User');

function isValidEAN(ean) {
    if (!/^\d{13}$/.test(ean)) return false; // Ensure 13 numeric digits

    const digits = ean.split('').map(Number);
    const checkDigit = digits.pop(); // Extract last digit (checksum)

    const sum = digits.reduce((acc, digit, i) => acc + digit * (i % 2 === 0 ? 1 : 3), 0);
    const calculatedCheckDigit = (10 - (sum % 10)) % 10;

    return calculatedCheckDigit === checkDigit;
}

// Auth routes
router.get('/scan', protect('user', 'admin'), scan);

router.get('/api/analysis', protect('user', 'admin'), async (req, res) => {
  try {
    const analyses = await Analysis.find(); // Populate 'user' field if needed
    res.status(200).json({analyses});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analyses', details: error.message });
  }
});

// Route to get a specific analysis record by ID
router.get('/api/analysis/:ean',  protect('user', 'admin'), async (req, res) => {
  const { ean } = req.params;

  // Validate the ID format
  if (!isValidEAN(ean)) {
    return res.status(400).json({ error: 'Invalid Barcode or EAN! Please try again.' });
  }

  try {
    const analysis = await Analysis.findOne({ ean }); // Populate 'user' field if needed

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.status(200).json({analysis});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analysis', details: error.message });
  }
});


router.get('/analyses', async (req, res) => {
  try {
    const analyses = await Analysis.find().populate('user', 'email'); // Populate user if needed
    res.render('analysis', { analyses });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Route to get a specific analysis by ID
router.get('/analyses/:id', async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id).populate('user'); // Populate user name
    if (!analysis) {
      return res.status(404).send('Analysis not found');
    }

    // Render a new EJS template or return JSON (adjust as needed)
    res.render('analysisDetails', { analysis }); // Replace with your detailed view template
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


module.exports = router;
