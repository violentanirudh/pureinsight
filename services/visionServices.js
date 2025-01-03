const vision = require('@google-cloud/vision');
const path = require('path');

const visionClient = new vision.ImageAnnotatorClient({
    keyFilename: path.join(__dirname, '/credentials.json'),
});

async function extractText(imageBuffer) {
    const [result] = await visionClient.textDetection({
        image: { content: imageBuffer },
    });
    return result.fullTextAnnotation.text;
}

module.exports = { extractText };
