const asyncHandler = require('../middlewares/asyncHandler');
const { detectText, analyzeText } = require('../services/textProcessing');

// Function to handle file uploads and detect text
const detectTextHandler = asyncHandler(async (req, res) => {
    // Validate that files are provided
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No image files provided.' });
    }

    console.log(req.files)

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
    const { detectedText } = req.body;

    if (!detectedText) {
        return res.status(400).json({ error: 'Detected text is required.' });
    }

    // Step 2: Analyze the detected text
    const analysis = await analyzeText(detectedText);

    // Return the analysis result as a response
    res.json({ analysis });
});

// Export both handlers as named exports
module.exports = {
    detectTextHandler,
    analyzeTextHandler,
};
