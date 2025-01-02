const express = require("express");
const router = express.Router();
const { scan } = require("../controllers/authController");
const { protect } = require("../middlewares/authorization");
const Analysis = require("../models/Analysis");
const User = require("../models/User");
const Verified = require("../models/Verified");

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
            "dietaryRestriction"  
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

module.exports = router;
