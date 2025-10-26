import express from 'express';
import { isAuthenticated,  isUserRole } from '../middleware/auth.js';
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
    
    // Import User model
    const User = (await import('../models/User.js')).default;
    
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

    // Return user data with CORRECT format
    const responseData = {
      success: true,
      id: user._id.toString(),
      _id: user._id.toString(), // Include both for compatibility
      username: user.username,
      email: user.email,
      role: user.role,
      assignedCaseManager: caseManagerId  // ✅ Just the ID string, not object!
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

// Get case manager info (optional - for showing case manager details)
router.get('/case-manager/:id', isAuthenticated, async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    
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