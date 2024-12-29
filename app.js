const express = require('express');
const path = require('path');
const authRoutes = require('./routes/authRoutes'); // Import your authRoutes file
const mongoose = require('mongoose'); // Add Mongoose for database connection

const app = express();

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static('public')); // Serve static files from the 'public' folder
app.use(express.json()); // Parse incoming JSON requests

// Routes
app.get('/', (req, res) => {
    res.render('index'); // Homepage
});

app.get('/account', (req, res) => {
    res.render('account'); // Account page
});

// Add auth routes
app.use('/api/auth', authRoutes); // Prefix all auth routes with /api/auth

// MongoDB Connection (Updated without deprecated options and using IPv4 address)
mongoose
  .connect('mongodb://127.0.0.1:27017/your-db-name') // Use IPv4 address
  .then(() => {
    console.log('Connected to MongoDB');
    // Start the server after connecting to the database
    const port = 3000;
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Database connection error:', error);
  });

// Export app for deployment (e.g., Vercel)
module.exports = app;
