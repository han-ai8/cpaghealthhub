import express from 'express';
import { isAuthenticated, isUserRole } from '../middleware/auth.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get current user profile (with assigned case manager)
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    console.log('═══════════════════════════════════');
    console.log('📡 GET /api/users/profile');
    console.log('User ID from auth:', req.user.id);
    console.log('User role:', req.user.role);
    
    // Get user by ID from auth middleware
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      console.log('❌ User not found with ID:', req.user.id);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log('✅ User found:', user.username);
    console.log('📌 assignedCaseManager (raw):', user.assignedCaseManager);
    console.log('📌 Type:', typeof user.assignedCaseManager);
    
    // IMPORTANT: Extract just the ID string, not the whole object
    let caseManagerId = null;
    if (user.assignedCaseManager) {
      // If it's an ObjectId, convert to string
      if (mongoose.Types.ObjectId.isValid(user.assignedCaseManager)) {
        caseManagerId = user.assignedCaseManager.toString();
      } else if (typeof user.assignedCaseManager === 'object') {
        // If it was populated, get the _id
        caseManagerId = user.assignedCaseManager._id?.toString() || user.assignedCaseManager.toString();
      } else {
        // If it's already a string
        caseManagerId = user.assignedCaseManager.toString();
      }
    }

    console.log('✅ Formatted caseManagerId:', caseManagerId);
    console.log('✅ Type:', typeof caseManagerId);

    // Return user data with ALL profile fields
    const responseData = {
      success: true,
      id: user._id.toString(),
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName || '',
      age: user.age || '',
      gender: user.gender || '',
      location: user.location || '',
      assignedCaseManager: caseManagerId
    };

    console.log('📤 Sending response:', responseData);
    console.log('═══════════════════════════════════');
    
    res.json(responseData);
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user profile',
      error: error.message 
    });
  }
});

// 🆕 UPDATE USER PROFILE - Using PUT method to avoid CORS issues
router.put('/profile', isAuthenticated, async (req, res) => {
  try {
    console.log('═══════════════════════════════════');
    console.log('📡 PUT /api/users/profile');
    console.log('User ID from auth:', req.user.id);
    console.log('User role:', req.user.role);
    console.log('Update data:', req.body);

    const { fullName, age, gender, location } = req.body;

    // Validate required fields
    if (!fullName || !age || !gender || !location) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'All fields are required: fullName, age, gender, location'
      });
    }

    // Validate age
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
      console.log('❌ Validation failed: Invalid age');
      return res.status(400).json({
        success: false,
        error: 'Age must be a number between 1 and 150'
      });
    }

    // Validate gender
    const validGenders = ['Male', 'Female', 'Other', 'Prefer not to say'];
    if (!validGenders.includes(gender)) {
      console.log('❌ Validation failed: Invalid gender');
      return res.status(400).json({
        success: false,
        error: 'Invalid gender value. Must be: Male, Female, Other, or Prefer not to say'
      });
    }

    // Find and update user
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('❌ User not found with ID:', req.user.id);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update profile fields
    user.fullName = fullName.trim();
    user.age = ageNum;
    user.gender = gender;
    user.location = location.trim();

    await user.save();

    console.log('✅ Profile updated successfully for user:', user.username);
    console.log('Updated fields:', {
      fullName: user.fullName,
      age: user.age,
      gender: user.gender,
      location: user.location
    });

    // Return updated user data
    res.json({
      success: true,
      message: 'Profile updated successfully',
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      age: user.age,
      gender: user.gender,
      location: user.location
    });

    console.log('═══════════════════════════════════');
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

// Get case manager info (optional - for showing case manager details)
router.get('/case-manager/:id', isAuthenticated, async (req, res) => {
  try {
    const caseManager = await User.findById(req.params.id)
      .select('username email role');

    if (!caseManager || caseManager.role !== 'case_manager') {
      return res.status(404).json({ 
        success: false, 
        message: 'Case manager not found' 
      });
    }

    res.json({
      success: true,
      caseManager: {
        id: caseManager._id.toString(),
        username: caseManager.username,
        email: caseManager.email,
        role: caseManager.role
      }
    });
  } catch (error) {
    console.error('Error fetching case manager:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch case manager',
      error: error.message 
    });
  }
});

export default router;