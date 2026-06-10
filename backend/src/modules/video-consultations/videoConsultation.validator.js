const AppError = require('../../utils/AppError');
const { isUuid, requireFields } = require('../../utils/validators');

function validateAppointmentId(appointmentId) {
  if (!isUuid(appointmentId)) {
    throw new AppError('Invalid appointmentId', 400);
  }
}

function validateVideoConsultationId(videoConsultationId) {
  if (!isUuid(videoConsultationId)) {
    throw new AppError('Invalid videoConsultationId', 400);
  }
}

function validateVideoMessage(payload) {
  requireFields(payload, ['content']);

  if (String(payload.content).trim().length < 1) {
    throw new AppError('Message content is required', 400);
  }
}

module.exports = {
  validateAppointmentId,
  validateVideoConsultationId,
  validateVideoMessage
};
