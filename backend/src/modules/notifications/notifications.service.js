const AppError = require('../../utils/AppError');
const { buildPagination, getPagination } = require('../../utils/pagination');
const { isUuid } = require('../../utils/validators');
const { writeAudit } = require('../../utils/audit');
const env = require('../../config/env');
const { dispatchNotification } = require('./providers');
const notificationsRepository = require('./notifications.repository');

function buildTeleconsultUrl(appointmentId) {
  return `${env.notifications.appBaseUrl.replace(/\/$/, '')}/teleconsulta/${appointmentId}`;
}

function buildAppointmentMessage(eventType, context) {
  const scheduledAt = new Date(context.scheduledStartAt).toLocaleString('es-CO');
  const modality = context.careChannel === 'virtual' ? 'Teleconsulta virtual' : 'Atencion presencial';
  const lines = {
    cita_agendada: `Tu cita fue confirmada con ${context.doctor} (${context.specialty}) para ${scheduledAt}.`,
    cita_modificada: `Tu cita con ${context.doctor} (${context.specialty}) fue actualizada para ${scheduledAt}.`,
    cita_cancelada: `Tu cita con ${context.doctor} (${context.specialty}) fue cancelada.`,
    cita_recordatorio_5_minutos: `Tu cita con ${context.doctor} (${context.specialty}) inicia en menos de 5 minutos.`
  };

  const base = lines[eventType] || `Actualizacion de cita con ${context.doctor}.`;
  const teleconsultLine = context.careChannel === 'virtual' ? ` Ingresa en: ${buildTeleconsultUrl(context.id)}.` : '';

  return `${base} Paciente: ${context.patient}. Modalidad: ${modality}.${teleconsultLine}`;
}

function getChannelsForUser(userPreferences) {
  const channels = ['interno'];

  if (userPreferences?.email) {
    channels.push('email');
  }

  if (userPreferences?.phone) {
    channels.push('whatsapp', 'sms');
  }

  return channels;
}

async function dispatchStoredNotification(notification) {
  const nextAttempt = Number(notification.attemptsCount || 0) + 1;
  await notificationsRepository.updateNotificationAttempt(notification.id, {
    status: 'programada',
    attemptsCount: nextAttempt,
    lastAttemptAt: new Date()
  });

  try {
    const delivery = await dispatchNotification(notification.channel, {
      destination: notification.destination,
      subject: `MediConnect · ${notification.eventType || notification.type}`,
      message: notification.message
    });

    return notificationsRepository.updateNotificationAttempt(notification.id, {
      status: delivery.status,
      provider: delivery.provider,
      providerMessageId: delivery.providerMessageId,
      attemptsCount: nextAttempt,
      lastAttemptAt: new Date(),
      sentAt: new Date(),
      deliveredAt: delivery.deliveredAt
    });
  } catch (error) {
    return notificationsRepository.updateNotificationAttempt(notification.id, {
      status: 'fallida',
      attemptsCount: nextAttempt,
      lastAttemptAt: new Date(),
      deliveryError: error.message
    });
  }
}

async function queueNotificationSet({ userId, appointmentId, eventType, typePrefix, message, metadata = null }) {
  const userPreferences = await notificationsRepository.getUserNotificationPreferences(userId);
  if (!userPreferences) {
    return [];
  }

  const created = [];

  for (const channel of getChannelsForUser(userPreferences)) {
    const destination =
      channel === 'email'
        ? userPreferences.email
        : channel === 'interno'
          ? userPreferences.email
          : userPreferences.phone;

    const notification = await notificationsRepository.createNotification(notificationsRepository, {
      userId,
      appointmentId,
      type: `${typePrefix}_${channel}`,
      eventType,
      channel,
      destination,
      provider: channel === 'interno' ? 'interno' : env.notifications.provider,
      message,
      status: 'programada',
      scheduledAt: new Date(),
      payload: metadata,
      metadata
    });

    created.push(await dispatchStoredNotification(notification));
  }

  return created;
}

async function sendCustomNotification({
  userId,
  appointmentId = null,
  eventType,
  typePrefix,
  message,
  metadata = null,
  actorUserId = null
}) {
  const deliveries = await queueNotificationSet({
    userId,
    appointmentId,
    eventType,
    typePrefix,
    message,
    metadata
  });

  await writeAudit({
    actorUserId,
    entity: 'notificacion',
    entityId: appointmentId || userId,
    action: `notificacion_${typePrefix}`,
    newValues: { eventType, deliveries: deliveries.length }
  });

  return deliveries;
}

async function sendAppointmentEventNotifications(eventType, appointmentId, actorUserId = null) {
  const context = await notificationsRepository.getAppointmentNotificationContext(appointmentId);
  if (!context) {
    throw new AppError('Appointment not found for notifications', 404);
  }

  const patientMessage = buildAppointmentMessage(eventType, context);
  const doctorMessage = buildAppointmentMessage(eventType, {
    ...context,
    doctor: context.patient,
    patient: context.doctor
  });

  const metadata = {
    patient: context.patient,
    doctor: context.doctor,
    specialty: context.specialty,
    careChannel: context.careChannel,
    scheduledStartAt: context.scheduledStartAt,
    teleconsultUrl: context.careChannel === 'virtual' ? buildTeleconsultUrl(context.id) : null
  };

  const deliveries = [
    ...(await queueNotificationSet({
      userId: context.patientUserId,
      appointmentId,
      eventType,
      typePrefix: eventType,
      message: patientMessage,
      metadata
    })),
    ...(await queueNotificationSet({
      userId: context.doctorUserId,
      appointmentId,
      eventType,
      typePrefix: eventType,
      message: doctorMessage,
      metadata
    }))
  ];

  await writeAudit({
    actorUserId,
    entity: 'notificacion',
    entityId: appointmentId,
    action: `notificaciones_${eventType}`,
    newValues: { eventType, deliveries: deliveries.length }
  });

  return deliveries;
}

async function processAppointmentReminders() {
  const appointmentIds = await notificationsRepository.listAppointmentsStartingBefore(
    new Date(Date.now() + 5 * 60 * 1000)
  );

  for (const appointmentId of appointmentIds) {
    const exists = await notificationsRepository.hasNotificationForAppointmentEvent(
      appointmentId,
      'cita_recordatorio_5_minutos',
      'interno'
    );

    if (!exists) {
      await sendAppointmentEventNotifications('cita_recordatorio_5_minutos', appointmentId, null);
    }
  }
}

async function listMyNotifications(filters, user) {
  const pagination = getPagination(filters);
  const result = await notificationsRepository.listNotificationsForUser(user.sub, {
    readState: filters.readState,
    eventType: filters.eventType,
    limit: pagination.limit,
    offset: pagination.offset
  });

  return {
    data: result.rows,
    pagination: buildPagination({ ...pagination, total: result.total })
  };
}

async function getMyNotification(notificationId, user) {
  if (!isUuid(notificationId)) {
    throw new AppError('Invalid notificationId', 400);
  }

  const notification = await notificationsRepository.findNotificationById(notificationId);
  if (!notification || notification.userId !== user.sub) {
    throw new AppError('Notification not found', 404);
  }

  return notification;
}

async function markMyNotificationRead(notificationId, user) {
  if (!isUuid(notificationId)) {
    throw new AppError('Invalid notificationId', 400);
  }

  const notification = await notificationsRepository.markNotificationRead(notificationId, user.sub);
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  return notification;
}

async function getUnreadSummary(user) {
  return {
    unreadCount: await notificationsRepository.countUnreadNotifications(user.sub)
  };
}

async function listNotificationsAdmin(filters, user) {
  if (user.role !== 'administrador') {
    throw new AppError('You do not have permission to access this resource', 403);
  }

  const pagination = getPagination(filters);
  const result = await notificationsRepository.listNotificationsAdmin({
    userId: filters.userId,
    channel: filters.channel,
    eventType: filters.eventType,
    status: filters.status,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    search: filters.search,
    limit: pagination.limit,
    offset: pagination.offset
  });

  return {
    data: result.rows,
    pagination: buildPagination({ ...pagination, total: result.total })
  };
}

async function retryNotification(notificationId, user) {
  if (user.role !== 'administrador') {
    throw new AppError('You do not have permission to access this resource', 403);
  }

  if (!isUuid(notificationId)) {
    throw new AppError('Invalid notificationId', 400);
  }

  const notification = await notificationsRepository.findNotificationById(notificationId);
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  return dispatchStoredNotification(notification);
}

module.exports = {
  getMyNotification,
  getUnreadSummary,
  listMyNotifications,
  listNotificationsAdmin,
  markMyNotificationRead,
  processAppointmentReminders,
  retryNotification,
  sendCustomNotification,
  sendAppointmentEventNotifications
};
