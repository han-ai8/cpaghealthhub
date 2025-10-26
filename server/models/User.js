import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: [100, 'Name must be at most 100 characters'],
    minlength: [1, 'Name must not be empty']
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
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'content_moderator', 'case_manager'],
    default: 'user'
  },
  active: {
    type: Boolean,
    default: true
  },
  // ✅ ADD THIS FIELD
  assignedCaseManager: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  savedPosts: {
    type: [{ type: Schema.Types.ObjectId }],
    ref: 'Post',
    default: []
  },
  // User Profile Fields
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
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.password.startsWith('$2b$')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default model('User', userSchema);