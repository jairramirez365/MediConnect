const AppError = require('../../utils/AppError');
const { isUuid, requireFields } = require('../../utils/validators');

function validateCreateAppointment(payload) {
  requireFields(payload, [
    'patientId',
    'doctorId',
    'scheduledStartAt',
    'scheduledEndAt',
    'timeZone',
    'reason',
    'appointmentType',
    'careChannel'
  ]);

  ['patientId', 'doctorId'].forEach((field) => {
    if (!isUuid(payload[field])) {
      throw new AppError(`Invalid UUID for ${field}`, 400);
    }
  });

  if (payload.commissionAgentId && !isUuid(payload.commissionAgentId)) {
    throw new AppError('Invalid UUID for commissionAgentId', 400);
  }

  if (payload.referralCodeId && !isUuid(payload.referralCodeId)) {
    throw new AppError('Invalid UUID for referralCodeId', 400);
  }

  if (Number.isNaN(Date.parse(payload.scheduledStartAt)) || Number.isNaN(Date.parse(payload.scheduledEndAt))) {
    throw new AppError('Invalid appointment date format', 400);
  }

  if (new Date(payload.scheduledStartAt) >= new Date(payload.scheduledEndAt)) {
    throw new AppError('scheduledEndAt must be greater than scheduledStartAt', 400);
  }

  if (!['primera_vez', 'control', 'seguimiento'].includes(payload.appointmentType)) {
    throw new AppError('Invalid appointmentType', 400);
  }

  if (!['virtual', 'presencial'].includes(payload.careChannel)) {
    throw new AppError('Invalid careChannel', 400);
  }
}

function validateStatusUpdate(payload) {
  requireFields(payload, ['status']);

  const allowedStatuses = [
    'pendiente_confirmacion',
    'confirmada',
    'en_curso',
    'completada',
    'cancelada_por_paciente',
    'cancelada_por_medico',
    'reprogramada',
    'no_asistio_paciente',
    'no_asistio_medico',
    'fallida'
  ];

  if (!allowedStatuses.includes(payload.status)) {
    throw new AppError('Invalid status', 400);
  }
}

function validateCommissionAgentChatResponse(payload) {
  requireFields(payload, ['action']);

  if (!['accept', 'reject'].includes(payload.action)) {
    throw new AppError('Invalid action for commission agent chat response', 400);
  }
}

module.exports = {
  validateCommissionAgentChatResponse,
  validateCreateAppointment,
  validateStatusUpdate
};
