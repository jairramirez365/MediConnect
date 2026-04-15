const AppError = require('../../utils/AppError');
const { isUuid } = require('../../utils/validators');
const { writeAudit } = require('../../utils/audit');
const clinicalRepository = require('./clinical.repository');

function ensureDoctorOwnsAppointment(user, appointment) {
  if (user.role === 'administrador') return;
  if (user.role === 'medico' && appointment.doctorUserId === user.sub) return;
  throw new AppError('You do not have permission for this clinical action', 403);
}

async function listMyMedicalRecords(user) {
  const patientProfile = await clinicalRepository.getPatientProfileByUserId(user.sub);
  if (!patientProfile) throw new AppError('Patient profile not found', 403);
  return clinicalRepository.listMedicalRecordsForPatient(patientProfile.id);
}

async function listPatientMedicalRecords(patientId, user) {
  if (!isUuid(patientId)) throw new AppError('Invalid patientId', 400);
  if (user.role === 'paciente') {
    const patientProfile = await clinicalRepository.getPatientProfileByUserId(user.sub);
    if (!patientProfile || patientProfile.id !== patientId) throw new AppError('You do not have permission to view this medical record', 403);
  }
  return clinicalRepository.listMedicalRecordsForPatient(patientId);
}

async function createClinicalNote(appointmentId, payload, user) {
  if (!isUuid(appointmentId)) throw new AppError('Invalid appointmentId', 400);
  const appointment = await clinicalRepository.findAppointmentForClinical(appointmentId);
  if (!appointment) throw new AppError('Appointment not found', 404);
  ensureDoctorOwnsAppointment(user, appointment);
  if (!['en_curso', 'completada', 'confirmada'].includes(appointment.status)) {
    throw new AppError('Appointment is not in a valid status for clinical notes', 409);
  }

  const note = await clinicalRepository.createClinicalNote({
    ...payload,
    appointmentId,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId
  });

  await writeAudit({
    actorUserId: user.sub,
    entity: 'nota_clinica',
    entityId: note.id,
    action: 'crear_nota_clinica',
    newValues: { appointmentId }
  });

  return note;
}

async function createPrescription(appointmentId, payload, user) {
  if (!isUuid(appointmentId)) throw new AppError('Invalid appointmentId', 400);
  if (!Array.isArray(payload.items) || payload.items.length === 0) throw new AppError('Prescription items are required', 400);

  const appointment = await clinicalRepository.findAppointmentForClinical(appointmentId);
  if (!appointment) throw new AppError('Appointment not found', 404);
  ensureDoctorOwnsAppointment(user, appointment);
  if (!['en_curso', 'completada', 'confirmada'].includes(appointment.status)) {
    throw new AppError('Appointment is not in a valid status for prescriptions', 409);
  }

  const prescription = await clinicalRepository.createPrescription({
    appointmentId,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    generalInstructions: payload.generalInstructions,
    items: payload.items
  });

  await writeAudit({
    actorUserId: user.sub,
    entity: 'receta',
    entityId: prescription.id,
    action: 'crear_receta',
    newValues: { appointmentId }
  });

  return prescription;
}

async function listMyPrescriptions(user) {
  const patientProfile = await clinicalRepository.getPatientProfileByUserId(user.sub);
  if (!patientProfile) throw new AppError('Patient profile not found', 403);
  return clinicalRepository.listPrescriptionsForPatient(patientProfile.id);
}

module.exports = {
  createClinicalNote,
  createPrescription,
  listMyMedicalRecords,
  listMyPrescriptions,
  listPatientMedicalRecords
};
