import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { isAuthenticated, isAdminRole } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ msg: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

// Inline logout function
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ msg: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.clearCookie('user.sid'); // Clear user session cookie
    res.clearCookie('admin.sid'); // Clear admin session cookie
    res.json({ msg: 'Logged out successfully' });
  });
};

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
  const normalizedEmail = email.toLowerCase().trim();

  try {
    let user = await User.findOne({ $or: [{ email: normalizedEmail }, { username }] });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      username,
      name: username,
      email: normalizedEmail,
      password,
      role: 'user'
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.username = user.username;
    await req.session.save();
    console.log('User registered and auto-logged in:', user.email);

    res.status(201).json({
      msg: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// User Login (with JWT)
router.post('/user/login', [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials (email not found)' });
    }

    if (user.role !== 'user') {
      return res.status(400).json({ msg: 'This account is not a regular user.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials (wrong password)' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    req.session.userId = user._id;
    req.session.role = user.role;
    await req.session.save();

    console.log('✅ USER logged in:', user.email, 'Role:', user.role);

    res.json({
      msg: 'Login successful',
      user: {
        id: user._id,
        name: user.name || '',
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error during login' });
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
  const normalizedEmail = email.toLowerCase().trim();

  try {
    let user = await User.findOne({ $or: [{ email: normalizedEmail }, { username }] });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      username,
      name: username,
      email: normalizedEmail,
      password: hashedPassword,
      role
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.username = user.username;
    await req.session.save();
    console.log('Admin registered and auto-logged in:', user.email);

    res.status(201).json({
      msg: 'Admin registered successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    console.error('Admin register error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Admin Login (with JWT)
router.post('/admin/login', [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ 
      email: normalizedEmail, 
      role: { $in: ['admin', 'content_moderator', 'case_manager'] }
    });
    
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials or not an admin' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    req.session.userId = user._id;
    req.session.role = user.role;
    await req.session.save();

    console.log('✅ ADMIN logged in:', user.email, 'Role:', user.role);

    res.json({
      msg: 'Login successful',
      user: {
        id: user._id,
        name: user.name || '',
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ============ COMMON ROUTES ============

router.post('/logout', logout);

// ✅ FIXED: Check session using TOKEN from Authorization header
router.get('/check-session', (req, res) => {
  // Priority 1: Check for JWT token in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Session check via TOKEN - User:', decoded.id, 'Role:', decoded.role);
      return res.json({
        authenticated: true,
        user: {
          id: decoded.id,
          role: decoded.role
        }
      });
    } catch (err) {
      console.error('Token verification failed in check-session:', err.message);
      // Token invalid, fall through to session check
    }
  }

  // Priority 2: Fallback to session (for backwards compatibility)
  if (req.session && req.session.userId) {
    console.log('⚠️ Session check via SESSION - User:', req.session.userId, 'Role:', req.session.role);
    return res.json({
      authenticated: true,
      user: {
        id: req.session.userId,
        username: req.session.username,
        role: req.session.role
      }
    });
  }

  // Not authenticated
  console.log('❌ Session check failed - No token or session');
  res.json({ authenticated: false });
});

// ============ PROTECTED ROUTES ============

router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId;
    console.log('GET /me - User ID from req.user/session:', userId);
    if (!userId) {
      return res.status(401).json({ msg: 'Not authenticated' });
    }
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json({ 
      user: {
        id: user._id,
        name: user.name || '',
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

router.get('/users', isAuthenticated, isAdminRole, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({
      users: users.map(user => ({
        id: user._id,
        name: user.name || '',
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

router.get('/admin/stats', isAuthenticated, isAdminRole, async (req, res) => {
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

router.delete('/users/:id', isAuthenticated, isAdminRole, async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId;
    if (req.params.id === userId.toString()) {
      return res.status(400).json({ msg: 'Cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.put('/profile', [
  isAuthenticated,
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1-100 characters'),
  body('username').optional().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.user?.id || req.session.userId;
  const userRole = req.user?.role || req.session.role;
  if (userRole !== 'user') {
    return res.status(403).json({ msg: 'Only regular users can update profile details here. Admins use the admin panel.' });
  }

  const { name, username } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (name !== undefined && name.trim() !== (user.name || '')) {
      const existingUser = await User.findOne({ name: name.trim() });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ msg: 'Alias already taken' });
      }
    }

    if (username !== undefined && username.trim() !== user.username) {
      const existingUser = await User.findOne({ username: username.trim() });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ msg: 'Username already taken' });
      }
    }

    if (name !== undefined) {
      user.name = name.trim();
    }
    if (username !== undefined) {
      user.username = username.trim();
    }

    await user.save();
    console.log('Profile updated for user:', userId);

    if (username !== undefined) {
      req.session.username = user.username;
      await req.session.save();
    }

    res.json({
      msg: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name || '',
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

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
  const userId = req.user?.id || req.session.userId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    console.log('Current password check result:', isMatch ? 'match' : 'mismatch');
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    console.log('Password changed for user:', userId);

    res.json({ msg: 'Password changed successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.put('/users/:id', [
  isAuthenticated,
  isAdminRole,
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1-100 characters'),
  body('username').optional().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('role').optional().isIn(['user', 'admin', 'content_moderator', 'case_manager']).withMessage('Invalid role')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, username: newUsername, role } = req.body;
  const targetUserId = req.params.id;
  const currentUserId = req.user?.id || req.session.userId;

  try {
    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (targetUserId === currentUserId && role !== undefined) {
      return res.status(400).json({ msg: 'Cannot change your own role' });
    }

    if (name !== undefined && name.trim() !== (user.name || '')) {
      const existingUser = await User.findOne({ name: name.trim() });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ msg: 'Alias already taken' });
      }
    }

    if (newUsername !== undefined && newUsername.trim() !== user.username) {
      const existingUser = await User.findOne({ username: newUsername.trim() });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ msg: 'Username already taken' });
      }
    }

    if (name !== undefined) {
      user.name = name.trim();
    }
    if (newUsername !== undefined) {
      user.username = newUsername.trim();
    }
    if (role !== undefined) {
      user.role = role;
    }

    await user.save();
    console.log('Admin updated user:', targetUserId, 'New role:', user.role);

    if (newUsername !== undefined && targetUserId === currentUserId) {
      req.session.username = user.username;
      await req.session.save();
    }

    res.json({
      msg: 'User details updated successfully',
      user: {
        id: user._id,
        name: user.name || '',
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Admin user update error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;