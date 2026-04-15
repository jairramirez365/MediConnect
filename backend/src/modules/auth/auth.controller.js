const authService = require('./auth.service');

async function register(req, res) {
  const session = await authService.register(req.body);

  res.status(201).json({
    message: 'User registered successfully',
    data: session
  });
}

async function login(req, res) {
  const session = await authService.login(req.body);

  res.status(200).json({
    message: 'Login successful',
    data: session
  });
}

async function me(req, res) {
  const user = await authService.getMe(req.user.sub);

  res.status(200).json({
    data: user
  });
}

module.exports = {
  login,
  me,
  register
};
