const AppError = require('../../utils/AppError');
const { hashPassword, verifyPassword } = require('../../utils/password');
const { signAccessToken } = require('../../utils/token');
const authRepository = require('./auth.repository');
const verificationService = require('./auth.verification.service');
const { validateLogin, validateRegister, validateResendVerification, validateVerifyContact } = require('./auth.validator');

const activeStatuses = ['activo'];

function buildSession(user) {
  const token = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    status: user.status
  });

  return {
    user,
    accessToken: token,
    tokenType: 'Bearer'
  };
}

async function register(payload) {
  validateRegister(payload);

  const existingUser = await authRepository.findUserByEmail(payload.email);

  if (existingUser) {
    throw new AppError('Email is already registered', 409);
  }

  const passwordHash = await hashPassword(payload.password);
  const status = 'pendiente_verificacion';

  const result = await authRepository.createUserWithProfile({
    email: payload.email,
    phone: payload.phone,
    passwordHash,
    role: payload.role,
    status,
    profile: payload.profile,
    currency: payload.currency
  });

  const verification = await verificationService.issueInitialVerifications(result.user, payload.phoneVerificationChannel);

  return {
    ...buildSession(result.user),
    user: result.user,
    profile: result.profile,
    balance: result.balance,
    verificationRequired: true,
    verification
  };
}

async function login(payload) {
  validateLogin(payload);

  const user = await authRepository.findUserByEmail(payload.email);

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  if (!activeStatuses.includes(user.status)) {
    throw new AppError('Account verification is required before login', 403, {
      userId: user.id,
      requiresVerification: true
    });
  }

  const isValidPassword = await verifyPassword(payload.password, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  await authRepository.updateLastLogin(user.id);

  delete user.passwordHash;
  return buildSession(user);
}

async function getMe(userId) {
  const user = await authRepository.findUserById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}

async function resendVerification(payload) {
  validateResendVerification(payload);
  return verificationService.resendVerification(payload);
}

async function verifyContact(payload) {
  validateVerifyContact(payload);
  return verificationService.verifyContact(payload);
}

async function getVerificationStatus(identifier) {
  return verificationService.getVerificationStatus(identifier);
}

module.exports = {
  getMe,
  getVerificationStatus,
  login,
  register,
  resendVerification,
  verifyContact
};
