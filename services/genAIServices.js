require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAIClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function generateAnalysis(prompt) {
    const model = genAIClient.getGenerativeModel({ model: "gemini-1.5-flash" });
    const response = await model.generateContent(prompt);
    return response.response.text();
}

module.exports = { generateAnalysis };
