export const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).json({ msg: 'Unauthorized. Please login.' });
};

export const isAdminRole = (req, res, next) => {
  if (req.session && req.session.userId) {
    const allowedRoles = ['admin', 'content_moderator', 'case_manager'];
    if (allowedRoles.includes(req.session.role)) {
      return next();
    }
  }
  res.status(403).json({ msg: 'Forbidden. Admin access required.' });
};