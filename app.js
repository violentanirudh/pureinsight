const express = require('express');
const path = require('path');
const vision = require('@google-cloud/vision');
const multer = require('multer');
const app = express();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const upload = multer({
    storage: multer.memoryStorage()
});

const visionClient = new vision.ImageAnnotatorClient({keyFilename: path.join(__dirname, '/credentials.json')});
const genAI = new GoogleGenerativeAI("AIzaSyBaUADPLYpJmXcgADpS2A4cowzDZWsa6cw");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/account', (req, res) => {
    res.render('account');
});

app.get('/scan', (req, res) => {
    res.render('scan');
});

// app.post('/process-image', upload.single('image'), async (req, res) => {
//     try {
//         // Method 1: For general text detection (OCR)
//         const [result] = await client.textDetection({
//             image: {
//                 content: req.file.buffer
//             }
//         });
        
//         // Get full text
//         const fullText = result.fullTextAnnotation.text;
        
//         // Get individual text blocks with confidence scores
//         const detections = result.textAnnotations.map(text => ({
//             text: text.description,
//             confidence: text.confidence,
//             boundingBox: text.boundingPoly.vertices
//         }));

//         // OR Method 2: For dense text documents (better for documents)
//         const [docResult] = await client.documentTextDetection({
//             image: {
//                 content: req.file.buffer
//             }
//         });

//         res.json({
//             fullText,
//             detections,
//             documentText: docResult?.fullTextAnnotation?.text
//         });

//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

app.post('/process-image', upload.single('image'), async (req, res) => {
    try {
        // Step 1: Extract text from image using Vision API
        const [result] = await visionClient.textDetection({
            image: {
                content: req.file.buffer
            }
        });
        
        const detectedText = result.fullTextAnnotation.text;

        // Step 2: Process text with Gemini AI
        const prompt = `You are a certified nutritionist and food safety expert. Analyze the provided food ingredients and provide a detailed assessment.

Required output:
1. A numerical health rating (1-10)
2. Dietary compatibility analysis
3. Allergen identification
4. Evidence-based health benefits
5. Complete nutritional breakdown
6. Ingredient analysis

Format your response in strict markdown with the following requirements:
1. Use ## for main sections
2. Use tables for comparative data
3. Use bullet points only for true lists
4. Bold important warnings or notes
5. Include emoji indicators (✓/✗) for yes/no items
6. Maximum 400 words total
7. Must be honest about health implications
8. Use "Not specified" for missing information

Return all information in clear, structured markdown that can be directly rendered into HTML.

Input text to analyze: ${detectedText}
`;

        const geminiResponse = await model.generateContent(prompt);
        const analysis = await geminiResponse.response.text();

        res.json({
            analysis: analysis
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});


// Remove app.listen() for Vercel deployment
// module.exports = app;

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
})