// middleware/auth.js
import jwt from 'jsonwebtoken';

/**
 * Middleware to check if user is authenticated via JWT token or session
 */
export const isAuthenticated = (req, res, next) => {
  // Priority 1: Check JWT token in Authorization header
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.id,
        role: decoded.role
      };
      console.log('✅ Auth via JWT token - User ID:', req.user.id, 'Role:', req.user.role);
      return next();
    } catch (err) {
      console.error('❌ Token verification failed:', err.message);
      return res.status(401).json({ msg: 'Invalid or expired token' });
    }
  }
  
  // Priority 2: Fallback to session (for backward compatibility)
  if (req.session && req.session.userId) {
    req.user = {
      id: req.session.userId,
      role: req.session.role
    };
    console.log('⚠️ Auth via session - User ID:', req.user.id, 'Role:', req.user.role);
    return next();
  }
  
  // No authentication found
  console.log('❌ Auth failed - No token or session');
  return res.status(401).json({ msg: 'Unauthorized. Please login.' });
};

/**
 * Middleware to check if user has admin role (admin, content_moderator, or case_manager)
 */
export const isAdminRole = (req, res, next) => {
  console.log('=== ADMIN ROLE CHECK ===');
  console.log('req.user:', req.user);
  
  if (!req.user) {
    console.log('❌ DENIED: No req.user found');
    return res.status(403).json({ msg: 'Forbidden. User not authenticated.' });
  }
  
  const allowedRoles = ['admin', 'content_moderator', 'case_manager'];
  console.log('User role:', req.user.role, 'Allowed roles:', allowedRoles);
  
  if (allowedRoles.includes(req.user.role)) {
    console.log('✅ ACCESS GRANTED for role:', req.user.role);
    return next();
  }
  
  console.log('❌ DENIED: Role not authorized');
  return res.status(403).json({ 
    msg: 'Forbidden. Admin access required.',
    yourRole: req.user.role,
    requiredRoles: allowedRoles
  });
};

/**
 * Middleware to ensure user is ONLY a regular user (not admin)
 */
export const isUserRole = (req, res, next) => {
  console.log('=== USER ROLE CHECK ===');
  console.log('req.user:', req.user);
  
  if (!req.user) {
    console.log('❌ DENIED: No req.user found');
    return res.status(403).json({ msg: 'Forbidden. User not authenticated.' });
  }
  
  if (req.user.role === 'user') {
    console.log('✅ ACCESS GRANTED for user role');
    return next();
  }
  
  console.log('❌ DENIED: Not a regular user');
  return res.status(403).json({ 
    msg: 'Forbidden. This feature is only for regular users.',
    yourRole: req.user.role
  });
};

/**
 * Middleware to check if user is specifically an admin (highest level)
 */
export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    console.log('❌ DENIED: Admin role required');
    return res.status(403).json({ msg: 'Forbidden. Admin role required.' });
  }
  console.log('✅ ACCESS GRANTED: Admin');
  next();
};

/**
 * Middleware to check if user is admin or content moderator
 */
export const isContentModerator = (req, res, next) => {
  if (!req.user || !['admin', 'content_moderator'].includes(req.user.role)) {
    console.log('❌ DENIED: Content moderator role required');
    return res.status(403).json({ msg: 'Forbidden. Content moderator role required.' });
  }
  console.log('✅ ACCESS GRANTED: Content Moderator');
  next();
};

/**
 * Middleware to check if user is admin or case manager
 */
export const isCaseManager = (req, res, next) => {
  if (!req.user || !['admin', 'case_manager'].includes(req.user.role)) {
    console.log('❌ DENIED: Case manager role required');
    return res.status(403).json({ msg: 'Forbidden. Case manager role required.' });
  }
  console.log('✅ ACCESS GRANTED: Case Manager');
  next();
};