const mongoose = require('mongoose');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Invalid email format']
  },
  password: {
    type: String,
    required: [true, "Password is required"]
  },
  credits: {
    type: Number,
    default: 0
  },
  allergies: [{
    type: String
  }],
  illness: [{
    type: String
  }],
  skin: {
    type: String
  },
  height: {
    type: Number
  },
  weight: {
    type: Number
  },
  verified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash if password is modified or new
  if (!this.isModified('password')) return next();
  
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(this.password, salt, 64).toString('hex');
  
  // Store both salt and hash
  this.password = `${salt}:${hash}`;
  next();
});

// Method to verify password
UserSchema.methods.matchPassword = async function(password) {
  const [salt, storedHash] = this.password.split(':');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return storedHash === hash;
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
