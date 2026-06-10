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

async function resendVerification(req, res) {
  const result = await authService.resendVerification(req.body);

  res.status(200).json({
    message: 'Verification resent successfully',
    data: result
  });
}

async function verifyContact(req, res) {
  const result = await authService.verifyContact(req.body);

  res.status(200).json({
    message: 'Contact verified successfully',
    data: result
  });
}

async function verificationStatus(req, res) {
  const result = await authService.getVerificationStatus(req.params.userId);

  res.status(200).json({
    data: result
  });
}

module.exports = {
  login,
  me,
  register,
  resendVerification,
  verificationStatus,
  verifyContact
};
