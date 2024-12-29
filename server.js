const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes'); // Updated file name

const app = express();

// Middleware to parse JSON data
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pureInsight', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
