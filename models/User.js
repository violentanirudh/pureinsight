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
    default: 100
  },
  allergies: {
    type: String,
    default: ''
  },
  illness: { 
    type: String,
    default: ''
  },
  skin: {
    type: String,
    default: ''
  },
  height: {
    type: Number,
    default: 0
  },
  weight: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  goals: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  meal: {
    type: Number,
    default: 3
  },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'super_active'],
    default: 'sedentary'
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'non_binary', 'prefer_not_to_say'],
    default: 'prefer_not_to_say'
  },
  ageGroup: {
    type: String,
    enum: ['child', 'teen', 'adult', 'senior'],
    default: 'adult'
  },
  dietaryRestriction: {
    type: String,
    enum: ['vegan', 'vegetarian', 'non_vegetarian'],
    default: 'non_vegetarian'
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
