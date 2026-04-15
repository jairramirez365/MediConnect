const AppError = require('../../utils/AppError');
const { requireFields } = require('../../utils/validators');

const allowedPublicRegistrationRoles = ['paciente', 'medico', 'comisionista'];

function requireProfileFields(profile, fields) {
  requireFields(profile || {}, fields);
}

function validateRegister(payload) {
  requireFields(payload, ['email', 'password', 'role', 'profile']);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    throw new AppError('Invalid email format', 400);
  }

  if (String(payload.password).length < 8) {
    throw new AppError('Password must have at least 8 characters', 400);
  }

  if (!allowedPublicRegistrationRoles.includes(payload.role)) {
    throw new AppError('Invalid role for public registration', 400);
  }

  if (payload.role === 'paciente') {
    requireProfileFields(payload.profile, [
      'firstName',
      'lastName',
      'documentType',
      'documentNumber',
      'birthDate'
    ]);
  }

  if (payload.role === 'medico') {
    requireProfileFields(payload.profile, [
      'firstName',
      'lastName',
      'documentType',
      'documentNumber',
      'medicalLicenseNumber',
      'consultationFee',
      'careMode',
      'city'
    ]);

    if (!['virtual', 'presencial', 'hibrida'].includes(payload.profile.careMode)) {
      throw new AppError('Invalid careMode', 400);
    }
  }

  if (payload.role === 'comisionista') {
    requireProfileFields(payload.profile, [
      'firstName',
      'lastName',
      'documentType',
      'documentNumber',
      'mainReferralCode',
      'baseCommissionPercentage'
    ]);
  }
}

function validateLogin(payload) {
  requireFields(payload, ['email', 'password']);
}

module.exports = {
  validateRegister,
  validateLogin
};
