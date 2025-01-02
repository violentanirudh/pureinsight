require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./services/mongodb'); // Import the database connection function
const cookieParser = require('cookie-parser');
const { validateToken } = require('./middlewares/authorization')

const app = express();

// Connect to MongoDB
connectDB();

const corsOptions = {
    optionsSuccessStatus: 200,
};

// Middleware to parse JSON and URL-encoded form data
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(validateToken)

// Serve static files
app.use('/js', express.static(path.join(__dirname, 'public/js'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Import routes
const mainRoutes = require('./routes/mainRoutes');
const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const processImageRoutes = require('./routes/processImageRoutes');

// Set view engine and static files directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// Use routes
app.use('/', mainRoutes);
app.use('/', protectedRoutes);
app.use('/api', processImageRoutes);
app.use('/api', processImageRoutes);
app.use('/auth', authRoutes);

// Global error handler
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
