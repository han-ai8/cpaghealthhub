// server/controllers/userAuthController.js
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import {
  generateVerificationCode,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail, // ✅ Add this
} from '../utils/emailService.js';

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new user and send verification email
// @route   POST /api/auth/user/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ 
        msg: 'Please provide all required fields' 
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    
    if (userExists) {
      // If user exists but not verified, resend verification code
      if (!userExists.isEmailVerified) {
        const verificationCode = generateVerificationCode();
        const verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        userExists.verificationCode = verificationCode;
        userExists.verificationCodeExpires = verificationCodeExpires;
        await userExists.save();

        // Send verification email
        await sendVerificationEmail(email, verificationCode, username);

        return res.status(200).json({
          msg: 'Account exists but not verified. New verification code sent to your email.',
          email: email,
          requiresVerification: true,
        });
      }

      return res.status(400).json({ 
        msg: 'Email already registered and verified' 
      });
    }

    // Check if username already taken
    const usernameExists = await User.findOne({ username: username });
    if (usernameExists) {
      return res.status(400).json({ 
        msg: 'Username already taken' 
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Create user (email not verified yet)
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      isEmailVerified: false,
      verificationCode,
      verificationCodeExpires,
      role: 'user',
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationCode, username);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Delete user if email fails
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ 
        msg: 'Failed to send verification email. Please try again.' 
      });
    }

    res.status(201).json({
      msg: 'Registration successful! Please check your email for verification code.',
      email: user.email,
      requiresVerification: true,
    });
  } catch (error) {
    res.status(500).json({ 
      msg: 'Registration failed. Please try again.' 
    });
  }
};

// @desc    Verify email with code
// @route   POST /api/auth/user/verify-email
// @access  Public
export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ 
        msg: 'Please provide email and verification code' 
      });
    }

    // Find user with verification code
    const user = await User.findOne({ 
      email: email.toLowerCase() 
    }).select('+verificationCode +verificationCodeExpires');

    if (!user) {
      return res.status(404).json({ 
        msg: 'User not found' 
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ 
        msg: 'Email already verified. Please login.' 
      });
    }

    // Check if code matches
    if (user.verificationCode !== code) {
      return res.status(400).json({ 
        msg: 'Invalid verification code' 
      });
    }

    // Check if code expired
    if (user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({ 
        msg: 'Verification code expired. Please request a new one.' 
      });
    }

    // Verify user
    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    sendWelcomeEmail(user.email, user.username).catch(err => {
      console.error('Failed to send welcome email:', err);
      // Don't fail the request if welcome email fails
    });


    // Generate token
    const token = generateToken(user._id, user.role);

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
  } catch (error) {
    res.status(500).json({ 
      msg: 'Verification failed. Please try again.' 
    });
  }
};

// @desc    Resend verification code
// @route   POST /api/auth/user/resend-verification
// @access  Public
export const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        msg: 'Please provide email address' 
      });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase() 
    });

    if (!user) {
      return res.status(404).json({ 
        msg: 'User not found' 
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ 
        msg: 'Email already verified' 
      });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    // Send verification email
    await sendVerificationEmail(email, verificationCode, user.username);

    res.status(200).json({
      msg: 'New verification code sent to your email',
    });
  } catch (error) {
    res.status(500).json({ 
      msg: 'Failed to resend verification code' 
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/user/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        msg: 'Please provide email and password' 
      });
    }

    // Find user
    const user = await User.findOne({ 
      email: email.toLowerCase() 
    }).select('+password');

    if (!user) {
      return res.status(401).json({ 
        msg: 'Invalid email or password' 
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({ 
        msg: 'Account locked due to multiple failed login attempts. Please try again later.' 
      });
    }

    // ✅ Check email verification BEFORE password check
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        msg: 'Please verify your email before logging in',
        requiresVerification: true,
        email: user.email,
      });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      await user.incLoginAttempts();
      
      // Get updated attempts count
      const updatedUser = await User.findById(user._id);
      const remainingAttempts = Math.max(0, 5 - updatedUser.loginAttempts);
      
      return res.status(401).json({ 
        msg: 'Invalid email or password',
        remainingAttempts
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      msg: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ 
      msg: 'Login failed. Please try again.' 
    });
  }
};

// @desc    Send password reset code
// @route   POST /api/auth/user/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        msg: 'Please provide email address' 
      });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase() 
    });

    if (!user) {
      // Don't reveal if user exists for security
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
    await sendPasswordResetEmail(email, resetCode, user.username);

    res.status(200).json({
      msg: 'If an account exists with this email, a password reset code has been sent.',
    });
  } catch (error) {
    res.status(500).json({ 
      msg: 'Failed to process request' 
    });
  }
};

// @desc    Reset password with code
// @route   POST /api/auth/user/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ 
        msg: 'Please provide email, code, and new password' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        msg: 'Password must be at least 6 characters long' 
      });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase() 
    }).select('+resetPasswordCode +resetPasswordExpires');

    if (!user) {
      return res.status(404).json({ 
        msg: 'Invalid reset code' 
      });
    }

    // Check if code matches
    if (user.resetPasswordCode !== code) {
      return res.status(400).json({ 
        msg: 'Invalid reset code' 
      });
    }

    // Check if code expired
    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ 
        msg: 'Reset code expired. Please request a new one.' 
      });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      msg: 'Password reset successful. Please login with your new password.',
    });
  } catch (error) {
    res.status(500).json({ 
      msg: 'Password reset failed. Please try again.' 
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
};