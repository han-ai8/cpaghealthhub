// models/User.js - FIXED VERSION WITH savedPosts FIELD
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // ✅ EXISTING FIELDS (keep as is)
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'case_manager'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // ✅ PROFILE FIELDS
  fullName: {
    type: String,
    default: ''
  },
  age: {
    type: Number,
    min: 1,
    max: 150
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say', ''],
    default: ''
  },
  location: {
    type: String,
    default: ''
  },

  // ✅ CASE MANAGER ASSIGNMENT
  assignedCaseManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // ✅✅ THIS IS THE MISSING FIELD - ADD THIS!
  savedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],

  // Optional profile object (if you're using this structure)
  profile: {
    age: Number,
    gender: String,
    location: String
  }
}, {
  timestamps: true
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;