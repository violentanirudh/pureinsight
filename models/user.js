const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema definition
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true, // Ensure email is stored in lowercase
      trim: true, // Remove extra spaces
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Prevent password from being returned in queries by default
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
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

// ===== Middleware to Hash Password Before Saving =====
userSchema.pre('save', async function (next) {
  try {
    // Only hash the password if it has been modified (or is new)
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// ===== Instance Method to Compare Passwords =====
userSchema.methods.isPasswordMatch = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

// ===== Virtual Field to Exclude Sensitive Data =====
// This ensures that sensitive information like the password and verification token
// are not included when converting the document to JSON or sending responses.
userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password; // Remove password field from the returned object
    delete ret.verificationToken; // Remove verification token from the returned object
    return ret;
  },
});

// ===== Static Method to Find User by Email with Password =====
// This method allows you to fetch a user with their password explicitly included.
userSchema.statics.findByEmailWithPassword = async function (email) {
  return await this.findOne({ email }).select('+password');
};

// ===== Static Method to Generate Verification Token =====
// Generates a random token for email verification or password reset.
userSchema.statics.generateVerificationToken = function () {
  return require('crypto').randomBytes(32).toString('hex');
};

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
