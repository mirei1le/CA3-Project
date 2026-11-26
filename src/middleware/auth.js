// Redirects to the login page if nobody is logged in
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// Only lets the given roles through, e.g. requireRole('lecturer', 'admin')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).render('error', {
        title: 'Access denied',
        message: 'You do not have permission to view this page.',
      });
    }
    next();
  };
}

module.exports = { requireLogin, requireRole };
