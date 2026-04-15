const AppError = require('../utils/AppError');

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      next(new AppError('Authenticated user is required', 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError('You do not have permission to access this resource', 403));
      return;
    }

    next();
  };
}

module.exports = authorizeRoles;
