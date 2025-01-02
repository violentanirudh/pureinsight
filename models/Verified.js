const mongoose = require('mongoose');

const verifiedSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    ean: {
      type: String, // Single string for EAN
      required: true,
      unique: true, // Ensures uniqueness
      index: true,  // Enforces unique index in MongoDB
    },
    text: {
      type: String,
      required: true,
    },
    analysis: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Export Verified Model
module.exports = mongoose.model('Verified', verifiedSchema);
