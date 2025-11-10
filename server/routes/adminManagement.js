// backend/routes/adminManagement.js - Staff management routes
import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { isAuthenticated, isAdminRole } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// GET ALL STAFF (admin, case_manager, content_moderator)
// ============================================
router.get('/staff-list', isAuthenticated, isAdminRole, async (req, res) => {
  try {
    console.log('📋 Fetching staff list...');
    
    const staff = await User.find({
      role: { $in: ['admin', 'case_manager', 'content_moderator'] }
    })
    .select('username email role isActive createdAt')
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${staff.length} staff members`);

    res.json({
      success: true,
      staff: staff.map(s => ({
        _id: s._id,
        username: s.username,
        email: s.email,
        role: s.role,
        isActive: s.isActive,
        createdAt: s.createdAt
      }))
    });
  } catch (err) {
    console.error('❌ Error fetching staff:', err);
    res.status(500).json({
      success: false,
      msg: 'Failed to fetch staff list',
      error: err.message
    });
  }
});

// ============================================
// CREATE STAFF MEMBER (case_manager or content_moderator)
// ============================================
router.post('/create-staff', isAuthenticated, isAdminRole, [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3-20 characters'),
  body('email')
    .isEmail()
    .withMessage('Invalid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['case_manager', 'content_moderator'])
    .withMessage('Invalid role')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      msg: errors.array()[0].msg,
      errors: errors.array() 
    });
  }

  const { username, email, password, role } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    console.log('👤 Creating staff member:', { username, email, role });

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username: username.trim() }
      ]
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return res.status(400).json({ 
          success: false,
          msg: 'Email already exists' 
        });
      }
      if (existingUser.username === username.trim()) {
        return res.status(400).json({ 
          success: false,
          msg: 'Username already taken' 
        });
      }
    }

    // Create new staff member
    const newStaff = new User({
      username: username.trim(),
      name: username.trim(),
      email: normalizedEmail,
      password, // Will be hashed by pre-save hook
      role,
      isActive: true
    });

    await newStaff.save();

    console.log('✅ Staff member created:', newStaff.username);

    res.status(201).json({
      success: true,
      msg: `${role === 'case_manager' ? 'Case Manager' : 'Content Moderator'} created successfully!`,
      user: {
        _id: newStaff._id,
        username: newStaff.username,
        email: newStaff.email,
        role: newStaff.role,
        isActive: newStaff.isActive
      }
    });
  } catch (err) {
    console.error('❌ Error creating staff:', err);
    res.status(500).json({
      success: false,
      msg: 'Failed to create staff member',
      error: err.message
    });
  }
});

// ============================================
// UPDATE STAFF MEMBER (username and isActive only)
// ============================================
router.put('/staff/:id', isAuthenticated, isAdminRole, [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3-20 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      msg: errors.array()[0].msg,
      errors: errors.array() 
    });
  }

  const { id } = req.params;
  const { username, isActive } = req.body;

  try {
    console.log('✏️ Updating staff member:', id);

    const staff = await User.findById(id);

    if (!staff) {
      return res.status(404).json({ 
        success: false,
        msg: 'Staff member not found' 
      });
    }

    // Check if username is already taken by another user
    if (username && username.trim() !== staff.username) {
      const existingUser = await User.findOne({
        username: username.trim(),
        _id: { $ne: id }
      });

      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          msg: 'Username already taken' 
        });
      }

      staff.username = username.trim();
      staff.name = username.trim();
    }

    if (typeof isActive === 'boolean') {
      staff.isActive = isActive;
    }

    await staff.save();

    console.log('✅ Staff member updated:', staff.username);

    res.json({
      success: true,
      msg: 'Staff member updated successfully',
      user: {
        _id: staff._id,
        username: staff.username,
        email: staff.email,
        role: staff.role,
        isActive: staff.isActive
      }
    });
  } catch (err) {
    console.error('❌ Error updating staff:', err);
    res.status(500).json({
      success: false,
      msg: 'Failed to update staff member',
      error: err.message
    });
  }
});

// ============================================
// RESET STAFF PASSWORD (admin only)
// ============================================
router.post('/staff/:id/reset-password', isAuthenticated, isAdminRole, [
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      msg: errors.array()[0].msg,
      errors: errors.array() 
    });
  }

  const { id } = req.params;
  const { newPassword } = req.body;

  try {
    console.log('🔑 Resetting password for staff:', id);

    const staff = await User.findById(id);

    if (!staff) {
      return res.status(404).json({ 
        success: false,
        msg: 'Staff member not found' 
      });
    }

    // Ensure this is a staff member (not regular user)
    if (!['admin', 'case_manager', 'content_moderator'].includes(staff.role)) {
      return res.status(403).json({ 
        success: false,
        msg: 'Can only reset passwords for staff members' 
      });
    }

    // Update password (will be hashed by pre-save hook)
    staff.password = newPassword;
    await staff.save();

    console.log('✅ Password reset for:', staff.username);

    res.json({
      success: true,
      msg: 'Password reset successfully. Please share the new password with the staff member.'
    });
  } catch (err) {
    console.error('❌ Error resetting password:', err);
    res.status(500).json({
      success: false,
      msg: 'Failed to reset password',
      error: err.message
    });
  }
});

// ============================================
// DELETE STAFF MEMBER
// ============================================
router.delete('/staff/:id', isAuthenticated, isAdminRole, async (req, res) => {
  const { id } = req.params;

  try {
    console.log('🗑️ Deleting staff member:', id);

    const staff = await User.findById(id);

    if (!staff) {
      return res.status(404).json({ 
        success: false,
        msg: 'Staff member not found' 
      });
    }

    // Prevent deleting admin accounts via this route (extra safety)
    if (staff.role === 'admin') {
      return res.status(403).json({ 
        success: false,
        msg: 'Cannot delete admin accounts through this route' 
      });
    }

    await User.findByIdAndDelete(id);

    console.log('✅ Staff member deleted:', staff.username);

    res.json({
      success: true,
      msg: 'Staff member deleted successfully'
    });
  } catch (err) {
    console.error('❌ Error deleting staff:', err);
    res.status(500).json({
      success: false,
      msg: 'Failed to delete staff member',
      error: err.message
    });
  }
});

export default router;