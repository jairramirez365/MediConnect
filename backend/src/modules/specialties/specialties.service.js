const AppError = require('../../utils/AppError');
const { isUuid } = require('../../utils/validators');
const specialtiesRepository = require('./specialties.repository');

async function listSpecialties() {
  return specialtiesRepository.listSpecialties();
}

async function createSpecialty(payload) {
  if (!payload.name) throw new AppError('name is required', 400);
  return specialtiesRepository.createSpecialty(payload);
}

async function updateSpecialty(id, payload) {
  if (!isUuid(id)) throw new AppError('Invalid specialtyId', 400);
  if (payload.status && !['activa', 'inactiva'].includes(payload.status)) throw new AppError('Invalid specialty status', 400);
  const specialty = await specialtiesRepository.updateSpecialty(id, payload);
  if (!specialty) throw new AppError('Specialty not found', 404);
  return specialty;
}

async function deleteSpecialty(id) {
  if (!isUuid(id)) throw new AppError('Invalid specialtyId', 400);
  const deleted = await specialtiesRepository.deleteSpecialty(id);
  if (!deleted) throw new AppError('Specialty not found', 404);
  return deleted;
}

async function assignMySpecialty(payload, user) {
  if (!isUuid(payload.specialtyId)) throw new AppError('Invalid specialtyId', 400);
  const doctorProfile = await specialtiesRepository.findDoctorProfileByUserId(user.sub);
  if (!doctorProfile) throw new AppError('Doctor profile not found', 403);
  await ensureDoctorCanReceiveSpecialty(doctorProfile.id, payload.specialtyId);
  return specialtiesRepository.assignSpecialtyToDoctor(doctorProfile.id, payload.specialtyId, payload.isPrimary);
}

async function assignSpecialtyToDoctor(doctorId, payload) {
  if (!isUuid(doctorId)) throw new AppError('Invalid doctorId', 400);
  if (!isUuid(payload.specialtyId)) throw new AppError('Invalid specialtyId', 400);
  await ensureDoctorCanReceiveSpecialty(doctorId, payload.specialtyId);
  return specialtiesRepository.assignSpecialtyToDoctor(doctorId, payload.specialtyId, payload.isPrimary);
}

async function removeSpecialtyFromDoctor(doctorId, specialtyId) {
  if (!isUuid(doctorId)) throw new AppError('Invalid doctorId', 400);
  if (!isUuid(specialtyId)) throw new AppError('Invalid specialtyId', 400);
  const deleted = await specialtiesRepository.removeSpecialtyFromDoctor(doctorId, specialtyId);
  if (!deleted) throw new AppError('Doctor specialty not found', 404);
  return deleted;
}

async function ensureDoctorCanReceiveSpecialty(doctorId, specialtyId) {
  const specialties = await specialtiesRepository.findActiveSpecialtiesByIds([specialtyId]);

  if (specialties.length === 0) {
    throw new AppError('Specialty not found or inactive', 404);
  }

  const alreadyAssigned = await specialtiesRepository.doctorAlreadyHasSpecialty(doctorId, specialtyId);
  if (alreadyAssigned) {
    return;
  }

  const total = await specialtiesRepository.countActiveSpecialtiesForDoctor(doctorId);
  if (total >= 2) {
    throw new AppError('A doctor can only have up to two specialties', 409);
  }
}

module.exports = {
  assignMySpecialty,
  assignSpecialtyToDoctor,
  createSpecialty,
  deleteSpecialty,
  listSpecialties,
  removeSpecialtyFromDoctor,
  updateSpecialty
};
