const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the User model
      required: true,
      ref: 'User', // Assuming you have a User model
    },
    ean: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\d{13}$/.test(v); // Validate EAN as a 13-digit number
        },
        message: 'EAN must be a valid 13-digit code.',
      },
    },
    text: {
      type: String,
      required: true,
    },
    analysis: {
      type: Object, // Assuming analysis is an object; adjust as needed
      required: true,
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model('Analysis', analysisSchema);
