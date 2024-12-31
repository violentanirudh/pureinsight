require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

const corsOptions = {
    origin: 'https://pureinsight.vercel.app',
    optionsSuccessStatus: 200
};

// Middleware to parse JSON and URL-encoded form data
app.use(express.json()); // Parse JSON payloads
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded form data
app.use(cors(corsOptions));

// Import routes
const mainRoutes = require('./routes/mainRoutes');
const processImageRoutes = require('./routes/processImageRoutes');

// Set view engine and static files directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// Use routes
app.use('/', mainRoutes);
app.use('/api', processImageRoutes);

// Global error handler (for unhandled errors)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
});

// Start server (remove for Vercel deployment)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app; // For deployment on platforms like Vercel
