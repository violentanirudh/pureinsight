const express = require("express");
const router = express.Router();
const { scan } = require("../controllers/authController");
const { protect } = require("../middlewares/authorization");
const Analysis = require("../models/Analysis");
const User = require("../models/User");
const Chat = require("../models/Chat");
const Verified = require("../models/Verified");
const {
    generateSessionId,
    handleChatMessage,
} = require("../services/chatServices");
const { htmlToText } = require("html-to-text");

function isValidEAN(ean) {
    if (!/^\d{13}$/.test(ean)) return false; // Ensure 13 numeric digits

    const digits = ean.split("").map(Number);
    const checkDigit = digits.pop(); // Extract last digit (checksum)

    const sum = digits.reduce(
        (acc, digit, i) => acc + digit * (i % 2 === 0 ? 1 : 3),
        0
    );
    const calculatedCheckDigit = (10 - (sum % 10)) % 10;

    return calculatedCheckDigit === checkDigit;
}

function stripHtml(htmlContent) {
    return htmlToText(htmlContent, {
        wordwrap: false,
        preserveNewlines: true,
    });
}

function calculateBMI(height, weight) {
    if (height <= 0 || weight <= 0) return null;
    const heightInMeters = height / 100;
    return parseFloat((weight / (heightInMeters ** 2)).toFixed(2));
}

router.get("/deep/:ean", protect("user", "admin"), async (req, res) => {
    const { ean } = req.params;

    try {
        const verifiedProduct = await Verified.findOne({ ean });

        if (!verifiedProduct) {
            return res.redirect("/search");
        }

        res.render("deep", { ean });
    } catch (error) {
        console.error("Error checking EAN in Verified:", error);
        res.redirect("/search");
    }
});

router.get("/scan", protect("user", "admin"), scan);

router.get("/search", protect("user", "admin"), async (req, res) => {
    res.render("search");
});

router.get("/api/search", protect("user", "admin"), async (req, res) => {
    const searchTerm = req.query.term; // Get the search term from query params

    try {
        // Find documents where title or ean matches the search term
        const results = await Verified.find({
            $or: [
                { title: { $regex: searchTerm, $options: "i" } }, // Case-insensitive regex for title
                { ean: { $regex: searchTerm, $options: "i" } }, // Case-insensitive regex for ean
            ],
        });

        res.json(results); // Return results as JSON
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while searching." });
    }
});

router.get("/profile", protect("user", "admin"), async (req, res) => {
    res.render("profile");
});

router.get("/api/analysis", protect("user", "admin"), async (req, res) => {
    try {
        const analyses = await Analysis.find(); // Populate 'user' field if needed
        res.status(200).json({ analyses });
    } catch (error) {
        res.status(500).json({
            error: "Failed to fetch analyses",
            details: error.message,
        });
    }
});

// Route to get a specific analysis record by ID
router.get("/api/analysis/:ean", protect("user", "admin"), async (req, res) => {
    const { ean } = req.params;

    // Validate the ID format
    if (!isValidEAN(ean)) {
        return res
            .status(400)
            .json({ error: "Invalid Barcode or EAN! Please try again." });
    }

    try {
        const analysis = await Analysis.findOne({ ean }); // Populate 'user' field if needed

        if (!analysis) {
            return res.status(404).json({ error: "Analysis not found" });
        }

        res.status(200).json({ analysis });
    } catch (error) {
        res.status(500).json({
            error: "Failed to fetch analysis",
            details: error.message,
        });
    }
});

router.get("/analyses", protect("admin"), async (req, res) => {
    try {
        const analyses = await Analysis.find().populate("user", "email"); // Populate user if needed
        res.render("analysis", { analyses });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// Route to get a specific analysis by ID
router.get("/analyses/:id", protect("admin"), async (req, res) => {
    try {
        const analysis = await Analysis.findById(req.params.id).populate(
            "user"
        ); // Populate user name
        if (!analysis) {
            return res.status(404).send("Analysis not found");
        }

        // Render a new EJS template or return JSON (adjust as needed)
        res.render("analysisDetails", { analysis }); // Replace with your detailed view template
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

router.post("/profile", protect("user", "admin"), async (req, res) => {
    try {
        const userId = req.user.id; // Assuming `req.user` contains authenticated user info
        const updatedData = req.body;

        // Prevent sensitive fields like password or role from being updated here
        const allowedUpdates = [
            "name",
            "credits",
            "allergies",
            "illness",
            "skin",
            "height",
            "weight",
            "goals",
            "meal",
            "activityLevel",
            "gender",
            "ageGroup",
            "dietaryRestriction",
        ];

        const filteredData = Object.keys(updatedData)
            .filter((key) => allowedUpdates.includes(key))
            .reduce((obj, key) => {
                obj[key] = updatedData[key];
                return obj;
            }, {});

        const updatedUser = await User.findByIdAndUpdate(userId, filteredData, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post(
    "/save-analysis",
    protect("admin"), // Middleware to ensure only admins can access this route
    async (req, res) => {
        const { title, ean, text, analysis, userId } = req.body; // Use userEmail instead of userId

        try {
            // Check if EAN already exists in Verified collection
            const existingRecord = await Verified.findOne({ ean });

            if (existingRecord) {
                return res
                    .status(400)
                    .json({ success: false, message: "EAN already exists." });
            }

            // Save new record in Verified collection
            const newRecord = await Verified.create({
                title,
                ean,
                text,
                analysis,
            });

            // Find user by email and update their credits
            const updatedUser = await User.findByIdAndUpdate(
                userId, // Query by email
                { $inc: { credits: 5 } }, // Increment credits by 5
                { new: true, runValidators: false } // Disable validation during update
            );

            if (!updatedUser) {
                return res
                    .status(404)
                    .json({ success: false, message: "User not found." });
            }

            res.status(201).json({
                success: true,
                message: "Data saved and user credited successfully.",
                data: newRecord,
            });
        } catch (error) {
            console.error("Error saving analysis:", error.message);

            res.status(500).json({
                success: false,
                message: "An error occurred while saving the analysis.",
                error: error.message,
            });
        }
    }
);

router.post("/api/chat", protect("user", "admin"), async (req, res) => {
    try {
        const { user } = req;
        const { ean } = req.body; // Assuming EAN is sent in the body
        const { userMessage } = req.body;

        // Validate required fields
        if (!user || !ean || !userMessage) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: user, EAN, or userMessage.",
            });
        }

        // Call the handleChatMessage function
        const result = await handleChatMessage(user, ean, userMessage);

        // Check if the function succeeded
        if (result.success) {
            return res.status(200).json({ success: true, response: result.response });
        } else {
            return res.status(400).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error("Error in /api/chat route:", error);

        // Handle unexpected errors
        return res.status(500).json({
            success: false,
            error: "An unexpected error occurred. Please try again later.",
        });
    }
});

router.get("/api/load-chat/:ean", protect("user", "admin"), async (req, res) => {
    const { ean } = req.params;
    const user = req.user;

    try {
        // Generate session ID based on user ID and EAN code
        const sessionId = generateSessionId(user._id, ean);

        // Check if the EAN exists in the Verified collection
        const verifiedProduct = await Verified.findOne({ ean });
        if (!verifiedProduct) {
            return res.status(404).json({
                success: false,
                error: "Product not found for the provided EAN.",
            });
        }

        // Reload or retrieve the latest chat session
        let chatSession = await Chat.findOne({ sessionId });

        if (!chatSession || Object.keys(chatSession.chats).length === 0) {
            // Fetch user data for personalization
            const userData = await User.findById(user._id);
            if (!userData) {
                return res.status(404).json({
                    success: false,
                    error: "User data not found.",
                });
            }

            const bmi = calculateBMI(userData.height, userData.weight);

            const prompt = `
You are a certified nutritionist, food safety expert, and skincare specialist. Analyze the following product based on its ingredients and provide a detailed assessment.
Be Strict with the information, You are here to help people make informed decisions about their health and well-being. Don't let them consume harmful products.

User Information:
- Name: ${userData.name}
- Age Group: ${userData.ageGroup}
- Gender: ${userData.gender}
- Height: ${userData.height} cm
- Weight: ${userData.weight} kg
- BMI: ${
                bmi
                    ? `${bmi} (${bmi < 18.5 ? "Underweight" : bmi < 24.9 ? "Normal" : bmi < 29.9 ? "Overweight" : "Obese"})`
                    : "Not available"
            }
- Activity Level: ${userData.activityLevel}
- Dietary Restriction: ${userData.dietaryRestriction}
- Allergies: ${userData.allergies || "None"}
- Illnesses: ${userData.illness || "None"}
- Skin Type: ${userData.skin || "Not specified"}
- Goals: ${userData.goals || "Not specified"}

Product Information:
- Title: ${verifiedProduct.title}
- Details: ${verifiedProduct.text}

Analysis Guidance:
${stripHtml(verifiedProduct.analysis)}

Important Instructions:
1. Consider every aspect of user and product information for a comprehensive analysis.
2. If the user's question is valid and related to health or the product or a follow up question, provide a detailed response based on your expertise.
3. Provide your assessment in valid HTML format (no <html>, <head>, <body> tags), don't use any background or shadows or padding at all.
4. Provide plain text (not a codeblock of HTML).
5. If the user asks a question unrelated to health, nutrition, skincare, or the product being analyzed, respond politely with:
   "I'm here to assist with questions related to health, nutrition, skincare, or this product. Please ask a relevant question so I can help you better."
`;

            chatSession = new Chat({ sessionId });
            await chatSession.save();

            const aiResponse = await handleChatMessage(user, ean, prompt);

            if (!aiResponse.success) {
                return res.status(500).json({
                    success: false,
                    error: "Failed to generate initial chat response.",
                });
            }
        } else {
            // Reload the chat session to ensure it's updated
            chatSession = await Chat.findOne({ sessionId }).lean();
        }

        let newChats = await Chat.findOne({ sessionId });

        // Filter out the very first user-generated message
        const filteredChats = Object.entries(newChats.chats)
            .filter(([timestamp, message], index) => !(index === 0 && message.role === "user"))
            .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {});

        // Return filtered chats to the frontend
        res.json({
            success: true,
            chats: filteredChats,
        });
    } catch (error) {
        console.error("Error loading chat:", error);
        res.status(500).json({
            success: false,
            error: "An unexpected error occurred.",
        });
    }
});


module.exports = router;
