const AppError = require('../../utils/AppError');
const { writeAudit } = require('../../utils/audit');
const { isUuid } = require('../../utils/validators');
const { buildPagination, getPagination } = require('../../utils/pagination');
const appointmentsRepository = require('./appointments.repository');
const {
  validateCreateAppointment,
  validateStatusUpdate
} = require('./appointments.validator');

function calculateCancellationWindow(scheduledStartAt) {
  return new Date(new Date(scheduledStartAt).getTime() - 6 * 60 * 60 * 1000);
}

function calculatePenaltyForLateCancellation(appointment, user) {
  const sixHoursFromNow = new Date(Date.now() + 6 * 60 * 60 * 1000);
  const scheduledStartAt = new Date(appointment.scheduledStartAt);

  if (user.role !== 'paciente') {
    return 0;
  }

  if (scheduledStartAt <= sixHoursFromNow) {
    return Number(appointment.cancellationPenalty || 0);
  }

  return 0;
}

function ensureCanManageAppointment(user, appointment, allowedActions) {
  const role = user.role;

  if (role === 'administrador') {
    return;
  }

  if (role === 'paciente' && allowedActions.includes('patient') && appointment.patientUserId === user.sub) {
    return;
  }

  if (role === 'medico' && allowedActions.includes('doctor') && appointment.doctorUserId === user.sub) {
    return;
  }

  if (role === 'comisionista' && allowedActions.includes('commissionAgent') && appointment.commissionAgentUserId === user.sub) {
    return;
  }

  throw new AppError('You do not have permission to manage this appointment', 403);
}

const allowedAppointmentTransitions = {
  pendiente_confirmacion: ['confirmada', 'cancelada_por_paciente', 'cancelada_por_medico', 'reprogramada'],
  confirmada: ['en_curso', 'completada', 'cancelada_por_paciente', 'cancelada_por_medico', 'reprogramada', 'no_asistio_paciente', 'no_asistio_medico', 'fallida'],
  en_curso: ['completada', 'fallida'],
  reprogramada: ['confirmada', 'cancelada_por_paciente', 'cancelada_por_medico'],
  completada: [],
  cancelada_por_paciente: [],
  cancelada_por_medico: [],
  no_asistio_paciente: [],
  no_asistio_medico: [],
  fallida: []
};

function ensureValidTransition(currentStatus, nextStatus) {
  const allowed = allowedAppointmentTransitions[currentStatus] || [];

  if (!allowed.includes(nextStatus)) {
    throw new AppError(`Invalid appointment transition from ${currentStatus} to ${nextStatus}`, 409);
  }
}

async function resolveScopedFilters(user, requestedFilters = {}) {
  const actorProfile = await appointmentsRepository.findActorProfile(user);

  if (user.role !== 'administrador' && !actorProfile) {
    throw new AppError('Profile not found for authenticated user', 403);
  }

  if (user.role === 'paciente') {
    return {
      ...requestedFilters,
      patientId: actorProfile.patientProfileId,
      doctorId: undefined,
      commissionAgentId: undefined
    };
  }

  if (user.role === 'medico') {
    return {
      ...requestedFilters,
      doctorId: actorProfile.doctorProfileId,
      patientId: undefined,
      commissionAgentId: undefined
    };
  }

  if (user.role === 'comisionista') {
    return {
      ...requestedFilters,
      commissionAgentId: actorProfile.commissionAgentProfileId,
      patientId: undefined,
      doctorId: undefined
    };
  }

  return requestedFilters;
}

async function createAppointment(payload, user) {
  const actorProfile = await appointmentsRepository.findActorProfile(user);

  if (user.role === 'paciente') {
    if (!actorProfile) {
      throw new AppError('Patient profile not found for authenticated user', 403);
    }

    payload.patientId = actorProfile.patientProfileId;
  }

  if (user.role === 'administrador' && !payload.patientId) {
    throw new AppError('patientId is required when an administrator creates an appointment', 400);
  }

  validateCreateAppointment(payload);

  const cancellationDeadline = calculateCancellationWindow(payload.scheduledStartAt);
  const result = await appointmentsRepository.createAppointment({
    ...payload,
    cancellationDeadline,
    cancellationPenalty: payload.cancellationPenalty || 0
  });

  switch (result.type) {
    case 'missing_doctor':
      throw new AppError('Doctor not found', 404);
    case 'missing_patient':
      throw new AppError('Patient not found', 404);
    case 'missing_commission_agent':
      throw new AppError('Commission agent not found', 404);
    case 'commission_agent_required':
      throw new AppError('Commission agent is required when commission chat access is requested', 400);
    case 'patient_not_authorized_for_agent_chat':
      throw new AppError('Patient has not authorized commission agent chat participation', 409);
    case 'invalid_referral_code':
      throw new AppError('Referral code not found or inactive', 400);
    case 'doctor_not_active':
      throw new AppError('Doctor is not active', 409);
    case 'doctor_unavailable':
      throw new AppError('Doctor does not have availability for this slot', 409);
    case 'doctor_overlap':
      throw new AppError('Doctor already has an appointment in this time range', 409);
    default:
      return result.appointment;
  }
}

async function listAppointments(filters, user) {
  if (filters.doctorId && !isUuid(filters.doctorId)) {
    throw new AppError('Invalid doctorId', 400);
  }

  if (filters.patientId && !isUuid(filters.patientId)) {
    throw new AppError('Invalid patientId', 400);
  }

  const scopedFilters = await resolveScopedFilters(user, filters);
  const pagination = getPagination(filters);
  const result = await appointmentsRepository.listAppointments({ ...scopedFilters, ...pagination });

  return {
    data: result.rows,
    pagination: buildPagination({ ...pagination, total: result.total })
  };
}

async function updateAppointmentStatus(appointmentId, payload) {
  if (!isUuid(appointmentId)) {
    throw new AppError('Invalid appointmentId', 400);
  }

  validateStatusUpdate(payload);

  const updatedAppointment = await appointmentsRepository.updateAppointmentStatus(
    appointmentId,
    payload.status,
    payload.cancellationReason,
    payload.cancelledByUserId
  );

  if (!updatedAppointment) {
    throw new AppError('Appointment not found', 404);
  }

  return updatedAppointment;
}

async function confirmAppointment(appointmentId, user) {
  if (!isUuid(appointmentId)) {
    throw new AppError('Invalid appointmentId', 400);
  }

  const appointment = await appointmentsRepository.findAppointmentById(appointmentId);

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  ensureCanManageAppointment(user, appointment, ['doctor']);
  ensureValidTransition(appointment.status, 'confirmada');

  const updated = await appointmentsRepository.updateAppointmentBusinessState(appointmentId, {
    status: 'confirmada'
  });

  await writeAudit({ actorUserId: user.sub, entity: 'cita', entityId: appointmentId, action: 'confirmar_cita', newValues: updated });
  return updated;
}

async function cancelAppointment(appointmentId, payload, user) {
  if (!isUuid(appointmentId)) {
    throw new AppError('Invalid appointmentId', 400);
  }

  const appointment = await appointmentsRepository.findAppointmentById(appointmentId);

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  ensureCanManageAppointment(user, appointment, ['patient', 'doctor']);

  const status = user.role === 'medico' ? 'cancelada_por_medico' : 'cancelada_por_paciente';
  ensureValidTransition(appointment.status, status);
  const penalty = calculatePenaltyForLateCancellation(appointment, user);

  const updated = await appointmentsRepository.updateAppointmentBusinessState(appointmentId, {
    status,
    cancellationReason: payload.cancellationReason || 'Cancelación solicitada',
    cancelledByUserId: user.sub,
    cancellationPenalty: penalty
  });

  await writeAudit({ actorUserId: user.sub, entity: 'cita', entityId: appointmentId, action: 'cancelar_cita', newValues: updated });
  return updated;
}

async function rescheduleAppointment(appointmentId, payload, user) {
  if (!isUuid(appointmentId)) {
    throw new AppError('Invalid appointmentId', 400);
  }

  if (!payload.scheduledStartAt || !payload.scheduledEndAt) {
    throw new AppError('scheduledStartAt and scheduledEndAt are required', 400);
  }

  if (new Date(payload.scheduledStartAt) >= new Date(payload.scheduledEndAt)) {
    throw new AppError('scheduledEndAt must be greater than scheduledStartAt', 400);
  }

  const appointment = await appointmentsRepository.findAppointmentById(appointmentId);

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  ensureCanManageAppointment(user, appointment, ['patient', 'doctor']);
  ensureValidTransition(appointment.status, 'reprogramada');

  const slotValidation = await appointmentsRepository.validateSlotForReschedule(
    appointment.doctorId,
    appointmentId,
    payload.scheduledStartAt,
    payload.scheduledEndAt
  );

  if (slotValidation.type === 'doctor_unavailable') {
    throw new AppError('Doctor does not have availability for this slot', 409);
  }

  if (slotValidation.type === 'doctor_overlap') {
    throw new AppError('Doctor already has an appointment in this time range', 409);
  }

  const updated = await appointmentsRepository.updateAppointmentBusinessState(appointmentId, {
    status: 'reprogramada',
    scheduledStartAt: payload.scheduledStartAt,
    scheduledEndAt: payload.scheduledEndAt,
    freeCancellationDeadline: calculateCancellationWindow(payload.scheduledStartAt)
  });

  await writeAudit({ actorUserId: user.sub, entity: 'cita', entityId: appointmentId, action: 'reprogramar_cita', newValues: updated });
  return updated;
}

async function completeAppointment(appointmentId, user) {
  if (!isUuid(appointmentId)) {
    throw new AppError('Invalid appointmentId', 400);
  }

  const appointment = await appointmentsRepository.findAppointmentById(appointmentId);

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  ensureCanManageAppointment(user, appointment, ['doctor']);
  ensureValidTransition(appointment.status, 'completada');

  const updated = await appointmentsRepository.updateAppointmentBusinessState(appointmentId, {
    status: 'completada'
  });

  await writeAudit({ actorUserId: user.sub, entity: 'cita', entityId: appointmentId, action: 'completar_cita', newValues: updated });
  return updated;
}

module.exports = {
  cancelAppointment,
  completeAppointment,
  confirmAppointment,
  createAppointment,
  listAppointments,
  rescheduleAppointment,
  updateAppointmentStatus
};
