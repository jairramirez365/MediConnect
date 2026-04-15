const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/token');

function authenticate(req, res, next) {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    next(new AppError('Authentication token is required', 401));
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authenticate;
