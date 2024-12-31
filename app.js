const express = require('express');
const path = require('path');
const mongoose = require('mongoose'); // Mongoose for MongoDB connection
const cookieParser = require('cookie-parser'); // Parse cookies
const authRoutes = require('./routes/authRoutes'); // Import your authRoutes file
const testEmailRoute = require('./routes/testEmailRoute'); // Import test email route
require('dotenv').config(); // Load environment variables from .env file
const userRoutes = require('./routes/userRoutes');
const app = express();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    
  })
  .catch((error) => {
    console.error('Database connection error:', error);
  });

// ===== Set up view engine =====
app.set('view engine', 'ejs'); // Use EJS as the templating engine
app.set('views', path.join(__dirname, 'views')); // Set the views directory

// ===== Middleware =====
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' folder
app.use(express.json()); // Parse incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data (e.g., form submissions)
app.use(cookieParser()); // Parse cookies

// ===== Routes =====
// Homepage route
app.get('/', (req, res) => {
  res.render('index', { title: 'Home' }); // Render the homepage (index.ejs) with a dynamic title
});

// Account page route (protected route example)
app.get('/account', (req, res) => {
  res.render('account', { title: 'Account' }); // Render the account page (account.ejs)
});

app.use('/', userRoutes);

// Authentication routes
app.use('/api/auth', authRoutes); // Prefix all auth routes with /api/auth

// Test email route
app.use('/api', testEmailRoute); // Add the test email route
// ===== MongoDB Connection =====


// ===== Error Handling Middleware =====
// Handle 404 errors (page not found)
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' }); // Render a custom 404 page (404.ejs)
});

// Handle other server errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { title: 'Server Error' }); // Render a custom error page (500.ejs)
});

// Export app for deployment (e.g., Vercel)
const port = process.env.PORT || 3000; // Use PORT from .env or default to 3000
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

module.exports = app;
