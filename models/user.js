const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema definition
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    isVerified: {
      type: Boolean,
      default: false, // User will be marked as unverified by default
    },
    verificationToken: {
      type: String,
      required: false, // Will store the verification token temporarily
    },
    role: {
      type: String,
      enum: ['user', 'admin'], // Role can be 'user' or 'admin'
      default: 'user', // Default role is 'user'
    },
    credit: {
      type: Number,
      default: 100, // Default credit for new users
    },
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

// ===== Middleware to Hash Password Before Saving =====
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// ===== Instance Method to Compare Passwords =====
userSchema.methods.isPasswordMatch = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
