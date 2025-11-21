// server/models/User.js - UPDATED WITH PHONE NUMBER
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    
    firstName: {
      type: String,
      trim: true,
      default: '',
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6, 
      select: false,
    },
    savedPosts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    }],

    phoneNumber: {
      type: String,
      trim: true,
      default: ''
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say', ''], 
      default: ''
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      province: { type: String, default: '' },
      zipCode: { type: String, default: '' },
    },
    
    fullName: {
      type: String,
      trim: true,
      default: ''
    },
    age: {
      type: Number,
      min: 1,
      max: 150,
      default: null
    },
    location: {
      type: String,
      trim: true,
      default: ''
    },
    
    role: {
      type: String,
      enum: ['user', 'admin', 'case_manager', 'content_moderator'],
      default: 'user',
    },
    
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      select: false,
    },
    verificationCodeExpires: {
      type: Date,
      select: false,
    },
    
    resetPasswordCode: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    
    profilePicture: {
      type: String,
      default: '',
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relationship: { type: String, default: '' },
      phoneNumber: { type: String, default: '' },
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },

    assignedCaseManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
  },
  {
    timestamps: true,
  }
);

userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
     // ✅ Check if password is already hashed
    if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
      console.log('⚠️ Password already hashed, skipping');
      return next();
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.incLoginAttempts = function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000;

  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }

  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

const User = mongoose.model('User', userSchema);

export default User;
