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

const prompt = `You are a certified nutritionist, food safety expert, and skincare specialist. Analyze the provided product (cosmetic or food) based on its ingredients and provide a detailed assessment. Be honest—if the product has more harm than good, reflect it in a low rating.

Required output:

Heading: Product Analysis Report

- Health / Quality Rating

    Provide a numerical rating (1-10) based on the balance of harm and benefit.
    Use bold font size (lg and colored text) for the rating (e.g., 8/10).
        1-4: Red (text-red-700, Harmful or low-quality product)
        5-7: Yellow (text-yellow-700, Moderate impact or quality)
        8-10: Green (text-green-700, Healthy or high-quality choice)
        use classes as per specified here.

- Product Type-Specific Analysis
For Food Products:

    Dietary Compatibility Analysis: Clearly state who should avoid this product.
        Use unordered lists with TailwindCSS classes:
            Green text (text-green-700) for groups who can consume it safely.
            Red text (text-red-700) for groups who should avoid it.
    Allergen Identification: Highlight major allergens in red text.
    Evidence-Based Health Benefits: List up to 10 benefits prioritized by significance (green text).
    Potential Side Effects: Highlight known risks or side effects in red text.
    Complete Nutritional Breakdown:
        Only include the 10 most important nutrients.
        Only include Nutrient, Per 100g, Concerns columns.
        Present key nutritional data in a table format.
        Highlight concerns (e.g., high sugar, sodium) in red text.

For Cosmetic Products:

    Skin Type Recommendations: Indicate whether the product is suitable for dry, oily, sensitive, or combination skin types.
        Specify if it is best for day or night use.
    Ingredient Functionality Analysis:
        Provide detailed information about each ingredient (e.g., moisturizer, antioxidant, exfoliant).
        Clearly mark harmful or irritating components in red text.
    Allergen Identification: Highlight major allergens in red text.
    Potential Side Effects: Highlight known risks or side effects in red text.

4. Format Requirements

    Use <h2> tags for main sections like "Numerical Health/Quality Rating" or "Ingredient Functionality Analysis."
    Use <ul> and <li> for lists (e.g., allergens, benefits, side effects).
    Use <table> for comparative data such as nutritional breakdowns or environmental impact summaries.
    Apply TailwindCSS classes for color coding:
        text-red-700 for harmful aspects.
        text-yellow-700 for moderate concerns.
        text-green-700 for beneficial aspects.
    Add a consistent disclaimer at the end:
    "Note: Always consult a healthcare provider or dermatologist if you have specific dietary restrictions, allergies, or skin conditions."
    Ensure all sections are present even if some data is unavailable (e.g., use "No significant benefits identified" if there are no health benefits).
    Provide valid HTML that can be directly rendered in a browser or webpage.

Additional Features for Premium Package:

    Personalized recommendations based on user-specific needs:
        For food: Suggest alternatives based on dietary preferences or allergies.
        For cosmetics: Recommend products based on skin conditions like acne, aging, hyperpigmentation, etc.
    Highlight unique selling points such as "Best for sensitive skin," "Ideal for nighttime use," or "Eco-friendly packaging."

Input text to analyze: ${detectedText}

If any required output cannot be generated due to unclear product details, just don't include the section in response.

If invalid products are detected (e.g., mismatched items, images of separate products), respond with this message:
"Error: The provided input appears invalid. Please ensure you upload a clear image of a single product with visible ingredients or provide accurate product details. Separate products cannot be analyzed together. Kindly try again with valid input."

Provide the html (and tailwindcss classes) as plain text (not as a codeblock) and don't include tags "<html> <head> and <body>"
`;

        const analysis = await genAIServices.generateAnalysis(prompt);
        return analysis;
    } catch (error) {
        throw new Error(`Error analyzing text: ${error.message}`);
    }
}

module.exports = { detectText, analyzeText };
