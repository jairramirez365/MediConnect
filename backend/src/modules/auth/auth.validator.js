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
      'city',
      'specialtyIds'
    ]);

    if (!Array.isArray(payload.profile.specialtyIds)) {
      throw new AppError('specialtyIds must be an array', 400);
    }

    if (payload.profile.specialtyIds.length < 1 || payload.profile.specialtyIds.length > 2) {
      throw new AppError('A doctor must register between one and two specialties', 400);
    }

    const uniqueSpecialtyIds = new Set(payload.profile.specialtyIds);
    if (uniqueSpecialtyIds.size !== payload.profile.specialtyIds.length) {
      throw new AppError('Doctor specialties cannot be duplicated', 400);
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
