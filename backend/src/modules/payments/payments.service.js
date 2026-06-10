const AppError = require('../../utils/AppError');
const { writeAudit } = require('../../utils/audit');
const { buildPagination, getPagination } = require('../../utils/pagination');
const { isUuid } = require('../../utils/validators');
const appointmentsRepository = require('../appointments/appointments.repository');
const notificationsService = require('../notifications/notifications.service');
const paymentsRepository = require('./payments.repository');

function ensurePaymentOwnership(user, payment) {
  if (user.role === 'administrador') {
    return;
  }

  if (user.role === 'paciente' && payment.patientUserId === user.sub) {
    return;
  }

  if (user.role === 'medico' && payment.doctorUserId === user.sub) {
    return;
  }

  if (user.role === 'comisionista' && payment.commissionAgentUserId === user.sub) {
    return;
  }

  throw new AppError('You do not have permission to access this payment', 403);
}

async function listPayments(filters, user) {
  await appointmentsRepository.expirePendingPaymentAppointments();
  const context = await paymentsRepository.findActorProfile(user);
  const pagination = getPagination(filters);
  const result = await paymentsRepository.listPayments({
    user,
    context,
    limit: pagination.limit,
    offset: pagination.offset,
    status: filters.status,
    method: filters.method,
    search: filters.search
  });

  return {
    data: result.rows,
    pagination: buildPagination({
      page: pagination.page,
      limit: pagination.limit,
      total: result.total
    })
  };
}

async function getPaymentsSummary(user) {
  await appointmentsRepository.expirePendingPaymentAppointments();
  const context = await paymentsRepository.findActorProfile(user);
  const aggregates = await paymentsRepository.getPaymentScopeAggregates(user, context);
  const balance = await paymentsRepository.getUserBalance(user.sub);

  const summary = {
    currency: balance.currency || 'COP',
    availableBalance: Number(balance.availableBalance || 0),
    heldBalance: Number(balance.heldBalance || 0),
    totalTransactions: Number(aggregates.totalTransactions || 0),
    paidTransactions: Number(aggregates.paidTransactions || 0),
    pendingTransactions: Number(aggregates.pendingTransactions || 0),
    pseTransactions: Number(aggregates.pseTransactions || 0),
    paidAmount: Number(aggregates.paidAmount || 0),
    pendingAmount: Number(aggregates.pendingAmount || 0),
    refundedAmount: Number(aggregates.refundedAmount || 0),
    liquidatedCommissionsAmount: Number(aggregates.liquidatedCommissionsAmount || 0),
    pendingCommissionsAmount: Number(aggregates.pendingCommissionsAmount || 0)
  };

  if (user.role === 'paciente') {
    const payableAppointments = await paymentsRepository.getPatientPayableAppointments(user.sub);
    return {
      ...summary,
      payableAppointmentsCount: payableAppointments.length
    };
  }

  if (user.role === 'medico') {
    const pendingCollectionAmount = await paymentsRepository.getDoctorPendingCollectionAmount(user.sub);
    return {
      ...summary,
      pendingCollectionAmount
    };
  }

  return summary;
}

async function listPayableAppointments(user) {
  await appointmentsRepository.expirePendingPaymentAppointments();
  if (user.role !== 'paciente') {
    throw new AppError('Only patients can list payable appointments from this endpoint', 403);
  }

  return paymentsRepository.getPatientPayableAppointments(user.sub);
}

async function createPseCheckout(appointmentId, payload, user) {
  await appointmentsRepository.expirePendingPaymentAppointments();
  if (!isUuid(appointmentId)) {
    throw new AppError('Invalid appointmentId', 400);
  }

  const appointment = await paymentsRepository.findAppointmentForPayment(appointmentId);

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (user.role !== 'administrador' && appointment.patientUserId !== user.sub) {
    throw new AppError('Only the appointment patient can initiate this payment', 403);
  }

  if (!['pendiente_pago', 'pendiente_confirmacion', 'confirmada'].includes(appointment.status)) {
    throw new AppError('Appointment is not payable in current status', 409);
  }

  if (Number(appointment.amount || 0) <= 0) {
    throw new AppError('This appointment does not require payment', 409);
  }

  const providerReference = payload.providerReference || `PSE-${Date.now()}`;
  const checkout = await paymentsRepository.createOrUpdatePendingPayment({
    appointmentId,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    amount: appointment.amount,
    currency: payload.currency || 'COP',
    paymentMethod: 'pse',
    providerReference
  });

  return {
    payment: checkout.payment,
    alreadyPaid: checkout.alreadyPaid,
    checkout: {
      provider: 'pse',
      mode: 'staging',
      reference: providerReference,
      status: checkout.alreadyPaid ? 'pagado' : 'pendiente',
      returnUrl: process.env.PSE_RETURN_URL || null,
      notifyUrl: process.env.PSE_NOTIFY_URL || null,
      commerceCode: process.env.PSE_COMMERCE_CODE || null
    }
  };
}

async function confirmStagingPsePayment(paymentId, payload, user) {
  await appointmentsRepository.expirePendingPaymentAppointments();
  if (!isUuid(paymentId)) {
    throw new AppError('Invalid paymentId', 400);
  }

  const payment = await paymentsRepository.findPaymentById(paymentId);

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  if (user.role !== 'administrador' && payment.patientUserId !== user.sub) {
    throw new AppError('Only the appointment patient can confirm this payment', 403);
  }

  const result = await paymentsRepository.settlePaymentById(paymentId, {
    paymentMethod: payment.paymentMethod || 'pse',
    providerReference: payload.providerReference || payment.providerReference || `PSE-${Date.now()}`
  });

  await writeAudit({
    actorUserId: user.sub,
    entity: 'pago',
    entityId: paymentId,
    action: 'confirmar_pago_pse_staging',
    newValues: { status: result.payment.status, method: result.payment.paymentMethod }
  });

  if (!result.alreadyPaid) {
    await notificationsService.sendAppointmentEventNotifications('cita_agendada', result.payment.appointmentId, user.sub);
  }

  return result;
}

async function createDummyPayment(appointmentId, payload, user) {
  await appointmentsRepository.expirePendingPaymentAppointments();
  if (!isUuid(appointmentId)) throw new AppError('Invalid appointmentId', 400);
  const appointment = await paymentsRepository.findAppointmentForPayment(appointmentId);
  if (!appointment) throw new AppError('Appointment not found', 404);

  if (user.role !== 'administrador' && appointment.patientUserId !== user.sub) {
    throw new AppError('Only the appointment patient can pay this appointment', 403);
  }

  if (!['pendiente_pago', 'pendiente_confirmacion', 'confirmada'].includes(appointment.status)) {
    throw new AppError('Appointment is not payable in current status', 409);
  }

  const result = await paymentsRepository.createDummyPayment({
    appointmentId,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    amount: appointment.amount,
    currency: payload.currency || 'COP',
    paymentMethod: payload.paymentMethod || 'dummy',
    providerReference: payload.providerReference || `DUMMY-${Date.now()}`
  });

  await writeAudit({
    actorUserId: user.sub,
    entity: 'pago',
    entityId: result.payment.id,
    action: 'crear_pago_dummy',
    newValues: { appointmentId, status: result.payment.status }
  });

  if (!result.alreadyPaid) {
    await notificationsService.sendAppointmentEventNotifications('cita_agendada', result.payment.appointmentId, user.sub);
  }

  return result;
}

module.exports = {
  confirmStagingPsePayment,
  createDummyPayment,
  createPseCheckout,
  getPaymentsSummary,
  listPayableAppointments,
  listPayments
};
