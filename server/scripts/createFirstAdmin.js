import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createFirstAdmin = async () => {
  try {
    console.log('🔐 Creating First Admin Account...');
    
    // Connect to MongoDB
    await mongoose.connect(`${process.env.MONGODB_URL}/HealthHub`);
    console.log('✅ Connected to database');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      role: 'admin',
      email: 'admin@healthhub.com' // Change this email
    });

    if (existingAdmin) {
      console.log('⚠️ Admin account already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Username:', existingAdmin.username);
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

    console.log('✅ First admin account created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', adminData.email);
    console.log('👤 Username:', adminData.username);
    console.log('🔑 Password:', adminData.password);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️ IMPORTANT: Save these credentials securely!');
    console.log('⚠️ Change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createFirstAdmin();