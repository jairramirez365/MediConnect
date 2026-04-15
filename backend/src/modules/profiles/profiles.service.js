const AppError = require('../../utils/AppError');
const { writeAudit } = require('../../utils/audit');
const profilesRepository = require('./profiles.repository');

async function getMyProfile(user) {
  const profile = await profilesRepository.getMyProfile(user);
  if (!profile) throw new AppError('Profile not found', 404);
  return profile;
}

async function updateMyProfile(payload, user) {
  let profile;

  if (user.role === 'paciente') {
    profile = await profilesRepository.updatePatientProfile(user.sub, payload);
  } else if (user.role === 'medico') {
    if (payload.careMode && !['virtual', 'presencial', 'hibrida'].includes(payload.careMode)) {
      throw new AppError('Invalid careMode', 400);
    }
    profile = await profilesRepository.updateDoctorProfile(user.sub, payload);
  } else {
    throw new AppError('Profile editing is not enabled for this role', 403);
  }

  if (!profile) throw new AppError('Profile not found', 404);

  await writeAudit({
    actorUserId: user.sub,
    entity: `perfil_${user.role}`,
    entityId: profile.id,
    action: 'actualizar_perfil',
    newValues: payload
  });

  return profile;
}

module.exports = {
  getMyProfile,
  updateMyProfile
};
