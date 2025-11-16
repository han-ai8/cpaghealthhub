// middleware/auth.js - Complete Authentication Middleware
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ============================================
// BASE AUTHENTICATION - Verify JWT Token
// ============================================
export const isAuthenticated = async (req, res, next) => {
  try {
    
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required. No token provided.' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required. Empty token.' 
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ 
        error: 'Invalid or expired token. Please login again.' 
      });
    }

    // Get user from database to verify they still exist
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found. Please login again.' 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Your account has been deactivated.' 
      });
    }

    // Attach user info to request
    req.user = {
      id: user._id.toString(),
      role: user.role,
      username: user.username,
      email: user.email
    };

    next();
  } catch (err) {
    res.status(500).json({ 
      error: 'Authentication failed',
      details: err.message 
    });
  }
};

// ============================================
// ADMIN ROLE CHECK
// ============================================
export const isAdmin = async (req, res, next) => {
  try {

    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied. Admin privileges required.',
        currentRole: req.user.role
      });
    }

    console.log('✅ Admin access granted');
    next();
  } catch (err) {
    res.status(500).json({ 
      error: 'Authorization check failed',
      details: err.message 
    });
  }
};

// ============================================
// CASE MANAGER ROLE CHECK
// ============================================
export const isCaseManager = async (req, res, next) => {
  try {

    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    // Allow both case_manager AND admin
    if (req.user.role !== 'case_manager' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied. Case Manager privileges required.',
        currentRole: req.user.role
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ 
      error: 'Authorization check failed',
      details: err.message 
    });
  }
};

// ============================================
// USER ROLE CHECK (Regular users only)
// ============================================
export const isUserRole = async (req, res, next) => {
  try {

    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    if (req.user.role !== 'user') {
      return res.status(403).json({ 
        error: 'Access denied. This endpoint is for regular users only.',
        currentRole: req.user.role
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ 
      error: 'Authorization check failed',
      details: err.message 
    });
  }
};

// ============================================
// ADMIN OR CASE MANAGER CHECK (For shared routes)
// ============================================
export const isAdminOrCaseManager = async (req, res, next) => {
  try {

    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'case_manager') {
      return res.status(403).json({ 
        error: 'Access denied. Admin or Case Manager privileges required.',
        currentRole: req.user.role
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ 
      error: 'Authorization check failed',
      details: err.message 
    });
  }
};

// ============================================
// CONTENT MODERATOR CHECK
// ============================================
export const isContentModerator = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    // Allow content_moderator and admin
    if (req.user.role !== 'content_moderator' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied. Content Moderator privileges required.',
        currentRole: req.user.role
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ 
      error: 'Authorization check failed',
      details: err.message 
    });
  }
};

// ============================================
// OPTIONAL AUTH (Don't fail if no token)
// ============================================
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided - continue without auth
      req.user = null;
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = {
          id: user._id.toString(),
          role: user.role,
          username: user.username,
          email: user.email
        };
      }
    } catch (err) {
      // Invalid token - continue without auth
      req.user = null;
    }
    
    next();
  } catch (err) {
    console.error('Optional auth error:', err);
    req.user = null;
    next();
  }
};

// ============================================
// LEGACY SUPPORT (For old code using these names)
// ============================================
export const isAdminRole = isAdmin;
export const isCaseManagerRole = isCaseManager;

export default {
  isAuthenticated,
  isAdmin,
  isCaseManager,
  isUserRole,
  isAdminOrCaseManager,
  isContentModerator,
  optionalAuth,
  isAdminRole,
  isCaseManagerRole
};