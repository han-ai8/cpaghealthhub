import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createFirstAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(`${process.env.MONGODB_URL}/HealthHub`);
    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      role: 'admin',
      email: 'admin@healthhub.com' // Change this email
    });

    if (existingAdmin) {
      process.exit(0);
    }

    // ⚠️ CHANGE THESE CREDENTIALS BEFORE RUNNING!
    const adminData = {
      username: 'healthhub_admin',      // ← Change this
      name: 'HealthHub Admin',           // ← Change this
      email: 'admin@healthhub.com',      // ← Change this to YOUR email
      password: 'Admin123!@#',           // ← Change this to a STRONG password
      role: 'admin',
      isActive: true,
      fullName: 'System Administrator'
    };

    // Create admin user
    const admin = new User(adminData);
    await admin.save(); // Password will be hashed automatically by pre-save hook

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

createFirstAdmin();