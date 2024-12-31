const visionServices = require('./visionServices');
const genAIServices = require('./genAIServices');

// Function to detect text from multiple image buffers
async function detectText(imageBuffers) {
    try {
        // Process each image buffer using Vision API
        const responses = await Promise.all(
            imageBuffers.map(async (buffer) => {
                try {
                    const detectedText = await visionServices.extractText(buffer); // Calls Vision API
                    return { text: detectedText };
                } catch (error) {
                    return { error: `Error detecting text: ${error.message}` }; // Handle errors for individual images
                }
            })
        );

        return responses; // Return results for all images
    } catch (error) {
        throw new Error(`Error processing images: ${error.message}`);
    }
}

async function analyzeText(detectedText) {
    try {

const prompt = `
You are a certified nutritionist and food safety expert. Analyze the provided food ingredients and provide a detailed assessment.
Be honest—if the product has more harm than good, reflect it in a low rating.

Required output:
1. A numerical health rating (1-10) based on the balance of harm and benefit. [rating in big bold font size (x/10)]
2. Dietary compatibility analysis, clearly stating who should avoid this product. [unordered list, red and green color]
3. Allergen identification with clear warnings for major allergens. [unordered list, red color]
4. Evidence-based health benefits, if any. Include only the 10 most important benefits, prioritized by their significance to health. [unordered list, green color]
5. Potential side effects of consuming the product. [unordered list, red text]
6. Complete nutritional breakdown with concerns highlighted in red. [unordered list, 10 most important ones only]
7. Ingredient analysis with harmful components clearly marked in red. [unordered list]

**Format requirements for consistency:**
1. Use <h2> for main sections (e.g., "Numerical Health Rating," "Dietary Compatibility Analysis").
2. Use <table> for comparative data (e.g., nutritional breakdown).
3. Use <ul> and <li> for true lists (e.g., allergens, side effects, health benefits).
4. Use <strong> and TailwindCSS classes like "text-red-700", "text-yellow-700", or "text-green-700" to indicate harmful, moderate, or beneficial aspects respectively.
5. Include a color-coded health rating:
   - 1-4: Red (Harmful to health)
   - 5-7: Yellow (Moderate health impact)
   - 8-10: Green (Healthy choice)
6. Add a consistent disclaimer at the end: "Note: Always consult a healthcare provider if you have specific dietary restrictions or allergies."
7. Ensure all sections are present, even if some data is unavailable (e.g., use "No significant benefits identified" if there are no health benefits).
8. Do not include any backticks, escape sequences, or code formatting.
9. Ensure the response is valid HTML that can be directly rendered in a browser or webpage.

Input text to analyze: ${detectedText}
`;

        const analysis = await genAIServices.generateAnalysis(prompt);
        return analysis;
    } catch (error) {
        throw new Error(`Error analyzing text: ${error.message}`);
    }
}

module.exports = { detectText, analyzeText };
