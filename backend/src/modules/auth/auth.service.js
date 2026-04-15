const AppError = require('../../utils/AppError');
const { hashPassword, verifyPassword } = require('../../utils/password');
const { signAccessToken } = require('../../utils/token');
const authRepository = require('./auth.repository');
const { validateLogin, validateRegister } = require('./auth.validator');

const activeStatuses = ['activo', 'pendiente_verificacion'];

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
  const status = payload.role === 'medico' ? 'pendiente_verificacion' : 'activo';

  const result = await authRepository.createUserWithProfile({
    email: payload.email,
    phone: payload.phone,
    passwordHash,
    role: payload.role,
    status,
    profile: payload.profile,
    currency: payload.currency
  });

  return {
    ...buildSession(result.user),
    profile: result.profile,
    balance: result.balance
  };
}

async function login(payload) {
  validateLogin(payload);

  const user = await authRepository.findUserByEmail(payload.email);

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  if (!activeStatuses.includes(user.status)) {
    throw new AppError('User is not allowed to login', 403);
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

module.exports = {
  getMe,
  login,
  register
};
