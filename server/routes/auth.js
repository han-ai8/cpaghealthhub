import { Router } from 'express';
import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { isAuthenticated, isAdminRole } from '../middleware/auth.js';
import { logout } from '../controllers/authController.js';

const router = express.Router();

// ============ USER ROUTES ============

// User Register
router.post('/user/register', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ msg: 'User   already exists' });
    }

    user = new User({
      username,
      email,
      password,
      role: 'user'
    });

    await user.save();

    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.username = user.username;

    res.status(201).json({
      msg: 'User   registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// User Login
router.post('/user/login', [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, role: 'user' });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.username = user.username;

    res.json({
      msg: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ============ ADMIN ROUTES ============

// Admin Register
router.post('/admin/register', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'content_moderator', 'case_manager']).withMessage('Invalid role')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, role } = req.body;

  try {
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ msg: 'User   already exists' });
    }

    user = new User({
      username,
      email,
      password,
      role
    });

    await user.save();

    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.username = user.username;

    res.status(201).json({
      msg: 'Admin registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Admin Login
router.post('/admin/login', [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ 
      email, 
      role: { $in: ['admin', 'content_moderator', 'case_manager'] }
    });
    
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials or not an admin' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.username = user.username;

    res.json({
      msg: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ============ COMMON ROUTES ============

// Logout
router.post('/logout', logout);

// Check session status
router.get('/check-session', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({
      authenticated: true,
      user: {
        id: req.session.userId,
        username: req.session.username,
        role: req.session.role
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// ============ PROTECTED ROUTES ============

// Get current user profile
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User   not found' });
    }
    res.json({ 
      user: {
        id: user._id,
        name: user.name || '', // Include name if it exists in model
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all users (Admin only)
router.get('/users', isAdminRole, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({
      users: users.map(user => ({
        id: user._id,
        name: user.name || user.username, // Fallback to username if no name
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Admin dashboard stats
router.get('/admin/stats', isAdminRole, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalAdmins = await User.countDocuments({ role: { $in: ['admin', 'content_moderator', 'case_manager'] } });
    const recentUsers = await User.find({ role: 'user' }).select('username email createdAt').sort({ createdAt: -1 }).limit(5);

    res.json({
      stats: {
        totalUsers,
        totalAdmins,
        totalAccounts: totalUsers + totalAdmins
      },
      recentUsers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete user (Admin only)
router.delete('/users/:id', isAdminRole, async (req, res) => {
  try {
    // Prevent deleting self
    if (req.params.id === req.session.userId.toString()) {
      return res.status(400).json({ msg: 'Cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User   not found' });
    }

    res.json({ msg: 'User   deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// UPDATED: Update user profile (name and username) - Authenticated users only
router.put('/profile', [
  isAuthenticated,
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1-100 characters'), // UPDATED: Added max length
  body('username').optional().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters') // Made optional for partial updates
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, username } = req.body;

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User   not found' });
    }

    // UPDATED: Check name (alias) uniqueness if provided and changed
    if (name && name.trim() !== user.name) {
      const existingUser  = await User.findOne({ name: name.trim() });
      if (existingUser  && existingUser ._id.toString() !== user._id.toString()) {
        return res.status(400).json({ msg: 'Alias already taken' });
      }
    }

    // Check username uniqueness if provided and changed
    if (username && username.trim() !== user.username) {
      const existingUser  = await User.findOne({ username: username.trim() });
      if (existingUser  && existingUser ._id.toString() !== user._id.toString()) {
        return res.status(400).json({ msg: 'Username already taken' });
      }
    }

    // Update fields if provided
    if (name !== undefined) user.name = name.trim();
    if (username !== undefined) user.username = username.trim();

    await user.save();

    req.session.username = user.username; // Update session

    res.json({
      msg: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Change password - Authenticated users only
router.put('/password', [
  isAuthenticated,
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User   not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ msg: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// UPDATED: Update user details (name/alias and role) - Admin only
router.put('/users/:id', [
  isAdminRole,
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1-100 characters'),
  body('role').optional().isIn(['user', 'admin', 'content_moderator', 'case_manager']).withMessage('Invalid role') // Made optional for partial updates
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, role } = req.body;
  const userId = req.params.id;

  try {
    // Prevent updating self (name or role)
    if (userId === req.session.userId.toString()) {
      return res.status(400).json({ msg: 'Cannot update your own details' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User   not found' });
    }

    // UPDATED: Check name (alias) uniqueness if provided and changed
    if (name !== undefined && name.trim() !== user.name) {
      const existingUser  = await User.findOne({ name: name.trim() });
      if (existingUser  && existingUser ._id.toString() !== user._id.toString()) {
        return res.status(400).json({ msg: 'Alias already taken' });
      }
    }

    // Update name (alias) if provided
    if (name !== undefined) {
      user.name = name.trim();
    }

    // Update role if provided
    if (role !== undefined) {
      user.role = role;
    }

    await user.save();

    res.json({
      msg: 'User   details updated successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;