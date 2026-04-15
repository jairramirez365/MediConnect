const AppError = require('../../utils/AppError');
const { isUuid } = require('../../utils/validators');
const { writeAudit } = require('../../utils/audit');
const paymentsRepository = require('./payments.repository');

async function createDummyPayment(appointmentId, payload, user) {
  if (!isUuid(appointmentId)) throw new AppError('Invalid appointmentId', 400);
  const appointment = await paymentsRepository.findAppointmentForPayment(appointmentId);
  if (!appointment) throw new AppError('Appointment not found', 404);

  if (user.role !== 'administrador' && appointment.patientUserId !== user.sub) {
    throw new AppError('Only the appointment patient can pay this appointment', 403);
  }

  if (!['pendiente_confirmacion', 'confirmada'].includes(appointment.status)) {
    throw new AppError('Appointment is not payable in current status', 409);
  }

  const result = await paymentsRepository.createDummyPayment({
    appointmentId,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    amount: appointment.amount,
    currency: payload.currency || 'COP',
    paymentMethod: payload.paymentMethod || 'dummy',
    providerReference: payload.providerReference || `DUMMY-${Date.now()}`,
    referralCodeId: appointment.referralCodeId,
    referrerUserId: appointment.referrerUserId,
    referrerType: appointment.referrerType
  });

  await writeAudit({
    actorUserId: user.sub,
    entity: 'pago',
    entityId: result.payment.id,
    action: 'crear_pago_dummy',
    newValues: { appointmentId, status: result.payment.status }
  });

  return result;
}

module.exports = {
  createDummyPayment
};
