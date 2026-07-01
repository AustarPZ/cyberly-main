function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    if (req.session.role !== role) {
      return res.status(403).json({ message: 'Forbidden.' });
    }
    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
