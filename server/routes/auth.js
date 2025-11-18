import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { isAuthenticated, isAdminRole } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import { 
  checkLoginAttempts, 
  recordFailedAttempt, 
  resetLoginAttempts 
} from '../middleware/rateLimiter.js';
import crypto from 'crypto';
import {
  generateVerificationCode,
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../utils/emailService.js';

const resetTokens = new Map();

// ============================================
// PROFANITY & INAPPROPRIATE WORDS FILTER
// ============================================
const inappropriateWords = [
  'admin', 'administrator', 'moderator', 'cpag', 'healthub', 'support',
  'fuck', 'shit', 'damn', 'ass', 'bitch', 'bastard', 'dick', 'cock',
  'pussy', 'cunt', 'whore', 'slut', 'nigger', 'nigga', 'faggot', 'fag',
  'retard', 'retarded', 'rape', 'rapist', 'nazi', 'hitler', 'kill', 'death', 
  'suicide', 'murder', 'terrorist', 'bomb', 'drug', 'cocaine', 'heroin',
  'hiv', 'aids', 'positive', 'negative', 'infected', 'disease', 'patient'
];

// Real name detection patterns
const realNamePatterns = [
  /^[A-Z][a-z]+[A-Z][a-z]+$/, // JohnSmith
  /^[A-Z][a-z]+\s[A-Z][a-z]+$/, // John Smith
  /^[A-Z]\.[A-Z]\./, // J.K.
  /^[A-Z][a-z]+_[A-Z][a-z]+$/, // John_Smith
];

// ============================================
// USERNAME VALIDATION FUNCTION
// ============================================
const validateUsername = (username) => {
  const errors = [];
  
  if (username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }
  if (username.length > 20) {
    errors.push('Username must not exceed 20 characters');
  }
  
  if (/\s/.test(username)) {
    errors.push('Username cannot contain spaces');
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscore, and hyphen');
  }
  
  const lowerUsername = username.toLowerCase();
  const foundInappropriate = inappropriateWords.find(word => 
    lowerUsername.includes(word.toLowerCase())
  );
  
  if (foundInappropriate) {
    errors.push('Username contains inappropriate, offensive, or restricted words. Please choose a different username.');
  }
  
  const seemsLikeRealName = realNamePatterns.some(pattern => pattern.test(username));
  if (seemsLikeRealName) {
    errors.push('For your privacy and safety, please do not use your real name. Choose a pseudonym or nickname instead.');
  }
  
  if (/^\d+$/.test(username)) {
    errors.push('Username cannot be only numbers. Please include letters.');
  }
  
  return errors;
};

// ============================================
// PASSWORD STRENGTH VALIDATOR
// ============================================
const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  const warnings = [];
  if (!/[A-Z]/.test(password)) {
    warnings.push('Consider adding uppercase letters for a stronger password');
  }
  if (!/[a-z]/.test(password)) {
    warnings.push('Consider adding lowercase letters for a stronger password');
  }
  if (!/[0-9]/.test(password)) {
    warnings.push('Consider adding numbers for a stronger password');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    warnings.push('Consider adding special characters for a stronger password');
  }
  
  return { errors, warnings };
};

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

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
    res.clearCookie('user.sid');
    res.clearCookie('admin.sid');
    res.json({ msg: 'Logged out successfully' });
  });
};

const router = express.Router();

// ============================================
// 📧 USER ROUTES WITH EMAIL VERIFICATION
// ============================================

// ✅ User Register (Enhanced with email verification)
// In your auth.js routes file, update the user/register route:

router.post('/user/register', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3-20 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscore, and hyphen')
    .custom((value) => {
      const usernameErrors = validateUsername(value);
      if (usernameErrors.length > 0) {
        throw new Error(usernameErrors[0]);
      }
      return true;
    }),
  body('email')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .custom((value) => {
      const { errors } = validatePasswordStrength(value);
      if (errors.length > 0) {
        throw new Error(errors[0]);
      }
      return true;
    })
], async (req, res) => {
  console.log('📝 Registration attempt started...');
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', errors.array());
    return res.status(400).json({ 
      msg: errors.array()[0].msg,
      errors: errors.array() 
    });
  }

  const { username, email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  console.log('📧 Resend configuration:', {
  hasApiKey: !!process.env.RESEND_API_KEY,
  fromEmail: process.env.RESEND_FROM_EMAIL
});

  try {
    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email: normalizedEmail }, 
        { username: username.trim() }
      ] 
    });
    
    if (user) {
      console.log('⚠️ User already exists:', { email: normalizedEmail, username: username.trim() });
      
      if (user.email === normalizedEmail && !user.isEmailVerified) {
        console.log('🔄 Resending verification code to existing unverified user...');
        
        try {
          const verificationCode = generateVerificationCode();
          const verificationCodeExpires = Date.now() + 10 * 60 * 1000;

          user.verificationCode = verificationCode;
          user.verificationCodeExpires = verificationCodeExpires;
          await user.save();

          console.log('📧 Attempting to send verification email...');
          await sendVerificationEmail(normalizedEmail, verificationCode, username);
          console.log('✅ Verification email sent successfully');

          return res.status(200).json({
            msg: 'Account exists but not verified. New verification code sent to your email.',
            email: normalizedEmail,
            requiresVerification: true,
          });
        } catch (emailError) {
          console.error('❌ Email sending failed:', emailError);
          return res.status(500).json({ 
            msg: 'Failed to send verification email. Please check server email configuration.',
            error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
          });
        }
      }

      if (user.email === normalizedEmail) {
        return res.status(400).json({ msg: 'This email is already registered. Please use a different email or login.' });
      }
      if (user.username === username.trim()) {
        return res.status(400).json({ msg: 'This username is already taken. Please choose a different username.' });
      }
    }

    // Validate username
    const usernameValidationErrors = validateUsername(username);
    if (usernameValidationErrors.length > 0) {
      console.log('❌ Username validation failed:', usernameValidationErrors);
      return res.status(400).json({ 
        msg: usernameValidationErrors[0],
        errors: usernameValidationErrors 
      });
    }


    console.log('🔐 Generating verification code...');
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = Date.now() + 10 * 60 * 1000;

    console.log('👤 Creating new user...');
    user = new User({
      username: username.trim(),
      name: username.trim(),
      email: normalizedEmail,
      password,
      role: 'user',
      isEmailVerified: false,
      verificationCode,
      verificationCodeExpires,
    });

    await user.save();
    console.log('✅ User created in database');

    console.log('📧 Attempting to send verification email...');
    try {
      await sendVerificationEmail(normalizedEmail, verificationCode, username);
      console.log('✅ Verification email sent successfully');
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      console.error('Error details:', {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command
      });
      
      // Delete user if email fails
      await User.findByIdAndDelete(user._id);
      console.log('🗑️ User deleted due to email failure');
      
      return res.status(500).json({ 
        msg: 'Failed to send verification email. Please check your email configuration.',
        error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }

    console.log('✅ Registration successful for:', username);

    res.status(201).json({
      msg: 'Registration successful! Please check your email for verification code.',
      email: user.email,
      requiresVerification: true,
    });
  } catch (err) {
    console.error('💥 Registration error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      msg: 'Server error. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ✅ Verify Email with Code
router.post('/user/verify-email', [
  body('email').isEmail().withMessage('Invalid email'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      msg: errors.array()[0].msg 
    });
  }

  const { email, code } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Find user with verification code
    const user = await User.findOne({ 
      email: normalizedEmail 
    }).select('+verificationCode +verificationCodeExpires');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ msg: 'Email already verified. Please login.' });
    }

    // Check if code matches
    if (user.verificationCode !== code) {
      return res.status(400).json({ msg: 'Invalid verification code' });
    }

    // Check if code expired
    if (user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({ msg: 'Verification code expired. Please request a new one.' });
    }

    // Verify user
    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    console.log('✅ Email verified:', user.email);

    res.status(200).json({
      msg: 'Email verified successfully!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ msg: 'Verification failed. Please try again.' });
  }
});

// ✅ Resend Verification Code
router.post('/user/resend-verification', [
  body('email').isEmail().withMessage('Invalid email')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ msg: errors.array()[0].msg });
  }

  const { email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ msg: 'Email already verified' });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    // Send verification email
    await sendVerificationEmail(normalizedEmail, verificationCode, user.username);

    console.log('✅ Verification code resent:', user.email);

    res.status(200).json({
      msg: 'New verification code sent to your email',
    });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ msg: 'Failed to resend verification code' });
  }
});

// ✅ User Forgot Password (Email Code)
router.post('/user/forgot-password', [
  body('email').isEmail().withMessage('Invalid email')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ msg: errors.array()[0].msg });
  }

  const { email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ 
      email: normalizedEmail,
      role: 'user'
    });

    if (!user) {
      // Don't reveal if user exists
      return res.status(200).json({
        msg: 'If an account exists with this email, a password reset code has been sent.',
      });
    }

    // Generate reset code
    const resetCode = generateVerificationCode();
    const resetCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = resetCodeExpires;
    await user.save();

    // Send email
    await sendPasswordResetEmail(normalizedEmail, resetCode, user.username);

    console.log('✅ Password reset code sent:', user.email);

    res.status(200).json({
      msg: 'If an account exists with this email, a password reset code has been sent.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ msg: 'Failed to process request' });
  }
});

// ✅ User Reset Password with Code
router.post('/user/reset-password', [
  body('email').isEmail().withMessage('Invalid email'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ msg: errors.array()[0].msg });
  }

  const { email, code, newPassword } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ 
      email: normalizedEmail,
      role: 'user'
    }).select('+resetPasswordCode +resetPasswordExpires');

    if (!user) {
      return res.status(404).json({ msg: 'Invalid reset code' });
    }

    // Check if code matches
    if (user.resetPasswordCode !== code) {
      return res.status(400).json({ msg: 'Invalid reset code' });
    }

    // Check if code expired
    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ msg: 'Reset code expired. Please request a new one.' });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log('✅ Password reset successful:', user.email);

    res.status(200).json({
      msg: 'Password reset successful. Please login with your new password.',
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ msg: 'Password reset failed. Please try again.' });
  }
});

// ============================================
// USER LOGIN (with rate limiting + email verification check)
// ============================================

router.post('/user/login', checkLoginAttempts, [
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
    // Find user with password field
    let user = await User.findOne({ email: normalizedEmail }).select('+password');
    
    if (!user) {
      const attemptRecord = await recordFailedAttempt(normalizedEmail);
      const remainingAttempts = 5 - (attemptRecord?.attempts || 0);
      
      return res.status(400).json({ 
        msg: 'Invalid credentials',
        remainingAttempts: Math.max(0, remainingAttempts)
      });
    }

    if (user.role !== 'user') {
      return res.status(400).json({ 
        msg: 'This account is not a regular user. Please use the admin login page.' 
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({ 
        msg: 'Your account has been deactivated. Please contact support for assistance.',
        accountInactive: true
      });
    }

    // Check email verification BEFORE password check
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        msg: 'Please verify your email before logging in',
        requiresVerification: true,
        email: user.email,
      });
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      const attemptRecord = await recordFailedAttempt(normalizedEmail);
      const remainingAttempts = 5 - (attemptRecord?.attempts || 0);
      
      if (attemptRecord && attemptRecord.attempts >= 5) {
        return res.status(429).json({
          msg: 'Account locked due to too many failed attempts. Please try again in 24 hours.',
          locked: true,
          lockedUntil: attemptRecord.lockedUntil
        });
      }
      
      return res.status(400).json({ 
        msg: 'Invalid credentials',
        remainingAttempts: Math.max(0, remainingAttempts),
        warning: remainingAttempts <= 2 ? `Only ${remainingAttempts} attempts remaining before account lock` : undefined
      });
    }

    // ✅ LOGIN SUCCESSFUL
    await resetLoginAttempts(normalizedEmail);

    const token = generateToken(user._id, user.role);

    req.session.userId = user._id;
    req.session.role = user.role;
    await req.session.save();

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
    console.error('Error stack:', err.stack);
    res.status(500).json({ msg: 'Server error during login' });
  }
});

// ============================================
// ADMIN LOGIN (with rate limiting)
// ============================================
router.post('/admin/login', checkLoginAttempts, [
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
    // ✅ FIX: Add .select('+password') to get the password field
    const user = await User.findOne({ 
      email: normalizedEmail, 
      role: { $in: ['admin', 'content_moderator', 'case_manager'] }
    }).select('+password'); // ← This is the key fix
    
    if (!user) {
      const attemptRecord = await recordFailedAttempt(normalizedEmail);
      const remainingAttempts = 5 - (attemptRecord?.attempts || 0);
      
      return res.status(400).json({ 
        msg: 'Invalid credentials or not an admin account',
        remainingAttempts: Math.max(0, remainingAttempts)
      });
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      const attemptRecord = await recordFailedAttempt(normalizedEmail);
      const remainingAttempts = 5 - (attemptRecord?.attempts || 0);
      
      if (attemptRecord && attemptRecord.attempts >= 5) {
        return res.status(429).json({
          msg: 'Account locked due to too many failed attempts. Please contact the administrator.',
          locked: true,
          lockedUntil: attemptRecord.lockedUntil
        });
      }
      
      return res.status(400).json({ 
        msg: 'Invalid credentials',
        remainingAttempts: Math.max(0, remainingAttempts),
        warning: remainingAttempts <= 2 ? `Only ${remainingAttempts} attempts remaining before account lock` : undefined
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        msg: 'Your account has been deactivated. Please contact the administrator.'
      });
    }

    // ✅ LOGIN SUCCESSFUL
    await resetLoginAttempts(normalizedEmail);

    const token = generateToken(user._id, user.role);

    req.session.userId = user._id;
    req.session.role = user.role;
    await req.session.save();

    console.log('✅ ADMIN/STAFF logged in:', user.email, 'Role:', user.role);

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
    console.error('Error stack:', err.stack); // ✅ Add detailed error logging
    res.status(500).json({ msg: 'Server error during login' });
  }
});

// ============ COMMON ROUTES ============

router.post('/logout', logout);

router.get('/check-session', (req, res) => {
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
      console.error('Token verification failed:', err.message);
    }
  }

  if (req.session && req.session.userId) {
    console.log('⚠️ Session check via SESSION - User:', req.session.userId);
    return res.json({
      authenticated: true,
      user: {
        id: req.session.userId,
        username: req.session.username,
        role: req.session.role
      }
    });
  }

  console.log('❌ Session check failed');
  res.json({ authenticated: false });
});

// ============ PROTECTED ROUTES ============

router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId;
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

// Add this to your auth.js routes file
// This goes in the PROTECTED ROUTES section

// PUT: Admin - Update user (including isActive status)
router.put('/users/:id', [
  isAuthenticated,
  isAdminRole,
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('username').optional().trim().isLength({ min: 3 }),
  body('isActive').optional().isBoolean(),
  body('role').optional().isIn(['user', 'admin', 'content_moderator', 'case_manager'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, username: newUsername, role, isActive } = req.body;
  const targetUserId = req.params.id;
  const currentUserId = req.user?.id || req.session.userId;

  try {
    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Prevent changing your own role
    if (targetUserId === currentUserId && role !== undefined) {
      return res.status(400).json({ msg: 'Cannot change your own role' });
    }

    // Check if username is already taken
    if (newUsername && newUsername.trim() !== user.username) {
      const existingUser = await User.findOne({
        username: newUsername.trim(),
        _id: { $ne: targetUserId }
      });

      if (existingUser) {
        return res.status(400).json({ msg: 'Username already taken' });
      }
    }

    // Update fields
    if (name !== undefined) user.name = name.trim();
    if (newUsername !== undefined) user.username = newUsername.trim();
    if (role !== undefined) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    console.log('✅ User updated by admin:', user.username, '| isActive:', user.isActive);

    res.json({
      msg: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name || '',
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.put('/profile', [
  isAuthenticated,
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('username').optional().trim().isLength({ min: 3 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.user?.id || req.session.userId;
  const userRole = req.user?.role || req.session.role;
  
  if (userRole !== 'user') {
    return res.status(403).json({ msg: 'Only regular users can update profile here.' });
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

    if (name !== undefined) user.name = name.trim();
    if (username !== undefined) user.username = username.trim();

    await user.save();

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
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// auth.js - PASSWORD CHANGE ROUTE SECTION
// Find the existing router.put('/password', ...) route and REPLACE it with this:
// This should be in the PROTECTED ROUTES section (around line 1200+)

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
  console.log('═══════════════════════════════════');
  console.log('🔐 Password change request received');
  console.log('User from middleware:', req.user);
  console.log('Request body keys:', Object.keys(req.body));
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', errors.array());
    return res.status(400).json({ 
      msg: errors.array()[0].msg,
      errors: errors.array() 
    });
  }

  const { currentPassword, newPassword } = req.body;
  
  // Get user ID from req.user (set by isAuthenticated middleware)
  const userId = req.user?.id || req.session?.userId;

  if (!userId) {
    console.log('❌ No user ID found in request');
    return res.status(401).json({ msg: 'Authentication required. Please login again.' });
  }

  try {
    console.log('📍 Looking up user:', userId);
    
    // Must explicitly select password field since it has select: false in schema
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ msg: 'User not found' });
    }

    console.log('✅ User found:', user.username);

    // Check if password field exists
    if (!user.password) {
      console.log('❌ Password field missing from user document');
      return res.status(500).json({ msg: 'User password data is invalid' });
    }

    // Verify current password
    console.log('🔍 Verifying current password...');
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      console.log('❌ Current password is incorrect');
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }

    console.log('✅ Current password verified');

    // Check if new password is different from current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      console.log('❌ New password same as current');
      return res.status(400).json({ 
        msg: 'New password must be different from current password' 
      });
    }

    // Update password (will be hashed by pre-save hook in User model)
    console.log('💾 Updating password...');
    user.password = newPassword;
    await user.save();

    console.log('✅ Password changed successfully for user:', user.username);
    console.log('═══════════════════════════════════');

    res.json({ msg: 'Password changed successfully' });
  } catch (err) {
    console.error('❌ Password change error:', err);
    console.error('Error stack:', err.stack);
    console.log('═══════════════════════════════════');
    res.status(500).json({ 
      msg: 'Server error while changing password',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

router.put('/users/:id', [
  isAuthenticated,
  isAdminRole,
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('username').optional().trim().isLength({ min: 3 }),
  body('role').optional().isIn(['user', 'admin', 'content_moderator', 'case_manager'])
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

    if (name !== undefined) user.name = name.trim();
    if (newUsername !== undefined) user.username = newUsername.trim();
    if (role !== undefined) user.role = role;

    await user.save();

    res.json({
      msg: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name || '',
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

// ============================================
// ADMIN FORGOT PASSWORD - CODE BASED
// ============================================
router.post('/admin/forgot-password', [
  body('email').isEmail().withMessage('Invalid email address')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation errors:', errors.array());
    return res.status(400).json({ msg: errors.array()[0].msg });
  }

  const { email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    console.log('🔐 Admin forgot password request for:', normalizedEmail);

    // Find admin user - don't need to select password here
    const user = await User.findOne({ 
      email: normalizedEmail,
      role: 'admin'
    });

    if (!user) {
      console.log('⚠️ Admin not found, but returning success (security)');
      // Don't reveal if admin exists for security
      return res.json({ 
        msg: 'If an admin account exists with this email, a password reset code has been sent.' 
      });
    }

    console.log('✅ Admin found:', user.username);

    // Generate reset code
    const resetCode = generateVerificationCode();
    const resetCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    console.log('🔑 Generated reset code:', resetCode);
    console.log('⏰ Code expires at:', new Date(resetCodeExpires));

    // Update user with reset code
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = resetCodeExpires;
    await user.save();

    console.log('💾 Reset code saved to database');

    // Send email
    try {
      await sendPasswordResetEmail(normalizedEmail, resetCode, user.username);
      console.log('✅ Password reset email sent successfully');
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      console.error('Email error details:', {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command
      });
      
      // Clean up the reset code if email fails
      user.resetPasswordCode = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      return res.status(500).json({ 
        msg: 'Failed to send reset email. Please check your email configuration.',
        error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }

    res.json({ 
      msg: 'If an admin account exists with this email, a password reset code has been sent.',
      // ✅ FOR DEVELOPMENT ONLY - Remove in production
      ...(process.env.NODE_ENV === 'development' && { 
        devCode: resetCode,
        devEmail: normalizedEmail 
      })
    });
  } catch (err) {
    console.error('❌ Admin forgot password error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      msg: 'Failed to process password reset request',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ============================================
// ADMIN VERIFY RESET CODE (Enhanced Validation)
// ============================================
router.post('/admin/verify-reset-code', [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email'),
  body('code')
    .trim()
    .isString()
    .isLength({ min: 6, max: 6 })
    .matches(/^\d{6}$/)
    .withMessage('Code must be exactly 6 digits')
], async (req, res) => {
  // ✅ Log the raw request body FIRST
  console.log('📥 Raw request body:', JSON.stringify(req.body, null, 2));
  console.log('📊 Code details:', {
    code: req.body.code,
    codeType: typeof req.body.code,
    codeLength: req.body.code?.length,
    email: req.body.email
  });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('❌ Validation errors:', JSON.stringify(errors.array(), null, 2));
    return res.status(400).json({ 
      valid: false, 
      msg: errors.array()[0].msg,
      errors: errors.array() // ✅ Send all errors for debugging
    });
  }

  const { email, code } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    console.log('🔍 Verifying reset code for:', normalizedEmail);
    console.log('🔑 Looking for code:', code);

    // ✅ SELECT the reset fields explicitly
    const user = await User.findOne({ 
      email: normalizedEmail,
      role: 'admin'
    }).select('+resetPasswordCode +resetPasswordExpires');

    if (!user) {
      console.log('❌ Admin not found');
      return res.status(400).json({ 
        valid: false, 
        msg: 'Invalid or expired code' 
      });
    }

    console.log('✅ User found, checking code...');
    console.log('📋 Comparison:', {
      storedCode: user.resetPasswordCode,
      storedCodeType: typeof user.resetPasswordCode,
      providedCode: code,
      providedCodeType: typeof code,
      match: user.resetPasswordCode === code,
      expires: user.resetPasswordExpires,
      now: Date.now(),
      isExpired: user.resetPasswordExpires < Date.now()
    });

    // Check if code matches
    if (user.resetPasswordCode !== code) {
      console.log('❌ Code mismatch');
      return res.status(400).json({ 
        valid: false, 
        msg: 'Invalid verification code' 
      });
    }

    // Check if code expired
    if (user.resetPasswordExpires < Date.now()) {
      console.log('❌ Code expired');
      return res.status(400).json({ 
        valid: false, 
        msg: 'Verification code expired. Please request a new one.' 
      });
    }

    console.log('✅ Code verified successfully');

    res.json({ 
      valid: true, 
      msg: 'Code verified successfully' 
    });
  } catch (err) {
    console.error('❌ Verify code error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      valid: false, 
      msg: 'Verification failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ============================================
// ADMIN RESET PASSWORD WITH CODE
// ============================================
router.post('/admin/reset-password-with-code', [
  body('email').isEmail().withMessage('Invalid email'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ msg: errors.array()[0].msg });
  }

  const { email, code, newPassword } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    console.log('🔐 Resetting password for:', normalizedEmail);

    // ✅ SELECT the reset fields explicitly
    const user = await User.findOne({ 
      email: normalizedEmail,
      role: 'admin'
    }).select('+resetPasswordCode +resetPasswordExpires');

    if (!user) {
      console.log('❌ Admin not found');
      return res.status(404).json({ msg: 'Invalid reset code' });
    }

    // Check if code matches
    if (user.resetPasswordCode !== code) {
      console.log('❌ Code mismatch');
      return res.status(400).json({ msg: 'Invalid reset code' });
    }

    // Check if code expired
    if (user.resetPasswordExpires < Date.now()) {
      console.log('❌ Code expired');
      return res.status(400).json({ 
        msg: 'Reset code expired. Please request a new one.' 
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log('✅ Admin password reset successful:', user.email);

    res.json({
      msg: 'Password reset successful. Please login with your new password.',
    });
  } catch (err) {
    console.error('❌ Reset password error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      msg: 'Password reset failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// ============================================
// ADMIN SELF-MANAGEMENT ROUTES
// ============================================

// Change Email (Admin Only)
router.put('/admin/change-email', [
  isAuthenticated,
  isAdminRole,
  body('newEmail').isEmail(),
  body('password').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ msg: errors.array()[0].msg });
  }

  const { newEmail, password } = req.body;
  const normalizedEmail = newEmail.toLowerCase().trim();
  const userId = req.user?.id || req.session.userId;

  try {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Incorrect password' });
    }

    if (user.email === normalizedEmail) {
      return res.status(400).json({ msg: 'New email must be different from current email' });
    }

    const existingUser = await User.findOne({ 
      email: normalizedEmail,
      _id: { $ne: userId }
    });

    if (existingUser) {
      return res.status(400).json({ msg: 'Email already in use by another account' });
    }

    user.email = normalizedEmail;
    await user.save();

    console.log('✅ Admin email updated:', userId);

    res.json({ 
      msg: 'Email updated successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Change email error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update Username (Admin Only)
router.put('/admin/update-username', [
  isAuthenticated,
  isAdminRole,
  body('username').trim().isLength({ min: 3, max: 20 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ msg: errors.array()[0].msg });
  }

  const { username } = req.body;
  const userId = req.user?.id || req.session.userId;

  try {
    const existingUser = await User.findOne({ 
      username: username.trim(),
      _id: { $ne: userId }
    });
    
    if (existingUser) {
      return res.status(400).json({ msg: 'Username already taken' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.username = username.trim();
    user.name = username.trim();
    await user.save();

    if (req.session) {
      req.session.username = user.username;
      await req.session.save();
    }

    console.log('✅ Admin username updated:', userId);

    res.json({
      msg: 'Username updated successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Update username error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Change Password (Admin Only)
router.put('/admin/change-password', [
  isAuthenticated,
  isAdminRole,
  body('currentPassword').exists(),
  body('newPassword').isLength({ min: 6 }),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ msg: errors.array()[0].msg });
  }

  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.id || req.session.userId;

  try {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }

    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ msg: 'New password must be different from current password' });
    }

    user.password = newPassword;
    await user.save();

    console.log('✅ Admin password changed:', userId);

    res.json({ msg: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;
