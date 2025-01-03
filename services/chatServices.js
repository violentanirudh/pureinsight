require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Chat = require("../models/Chat");
const crypto = require("crypto");

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const generateSessionId = (user, eanCode) => {
    const hash = crypto.createHash("sha256");
    hash.update(`${user}-${eanCode}`);
    return hash.digest("hex");
};

const handleChatMessage = async (user, eanCode, userMessage) => {
    if (!user || !eanCode || !userMessage) {
        return {
            success: false,
            error: "Missing required fields.",
        };
    }

    try {
        // Generate session ID based on user and EAN code
        const sessionId = generateSessionId(user._id, eanCode);

        // Retrieve an existing chat session from MongoDB
        let chatSession = await Chat.findOne({ sessionId });
        if (!chatSession) {
            return {
                success: false,
                error: "Chat session does not exist.",
            };
        }

        // Add user's message to the chats object with a timestamp key
        const timestamp = new Date().toISOString();
        chatSession.chats[timestamp] = { role: "user", text: userMessage };

        // Explicitly mark chats as modified
        chatSession.markModified("chats");

        // Prepare history for Google Generative AI in the correct format
        const history = Object.entries(chatSession.chats).map(([key, value]) => ({
            role: value.role,
            parts: [{ text: value.text }],
        }));

        // Initialize the Google Generative AI model
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Start or continue the chat session with history
        const chat = model.startChat({
            history,
        });

        userMessage += userMessage + "Keep answer short and in points.";

        // Send the user's message to the model and get a response
        const result = await chat.sendMessage(userMessage);

        // Extract AI's response
        const aiResponse = result.response.text();

        // Add AI's response to the chats object with a new timestamp key
        const aiTimestamp = new Date().toISOString();
        chatSession.chats[aiTimestamp] = { role: "model", text: aiResponse };

        // Explicitly mark chats as modified again
        chatSession.markModified("chats");

        // Save updated session to MongoDB
        await chatSession.save();

        // Return AI's response
        return {
            success: true,
            response: aiResponse,
        };
    } catch (error) {
        console.error("Error in handleChatMessage:", error);
        return {
            success: false,
            error: "Something went wrong.",
        };
    }
};


module.exports = {
    generateSessionId,
    handleChatMessage,
};