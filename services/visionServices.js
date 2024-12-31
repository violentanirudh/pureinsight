const vision = require('@google-cloud/vision');

const visionClient = new vision.ImageAnnotatorClient({
    keyFilename: process.env.CREDENTIALS_PATH,
});

async function extractText(imageBuffer) {
    const [result] = await visionClient.textDetection({
        image: { content: imageBuffer },
    });
    return result.fullTextAnnotation.text;
}

module.exports = { extractText };
