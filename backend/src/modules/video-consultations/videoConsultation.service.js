const AppError = require('../../utils/AppError');
const env = require('../../config/env');
const { writeAudit } = require('../../utils/audit');
const { buildPagination, getPagination } = require('../../utils/pagination');
const notificationsService = require('../notifications/notifications.service');
const videoConsultationRepository = require('./videoConsultation.repository');
const { getProviderService } = require('./videoProvider.service');
const {
  validateAppointmentId,
  validateVideoConsultationId,
  validateVideoMessage
} = require('./videoConsultation.validator');

const videoProvider = getProviderService();

function calculateAccessWindow(appointment) {
  const accessWindowMs = env.video.accessWindowMinutes * 60 * 1000;

  return {
    accessStartsAt: new Date(new Date(appointment.scheduledStartAt).getTime() - accessWindowMs),
    accessEndsAt: new Date(new Date(appointment.scheduledEndAt).getTime() + accessWindowMs)
  };
}

function calculateTokenExpiry(appointment) {
  const ttlMs = env.video.tokenTtlMinutes * 60 * 1000;
  const accessEndsAt = new Date(calculateAccessWindow(appointment).accessEndsAt);
  const ttlCandidate = new Date(Date.now() + ttlMs);

  return ttlCandidate < accessEndsAt ? ttlCandidate : accessEndsAt;
}

function canManageRoom(user, appointment) {
  return (
    user.role === 'administrador' ||
    (user.role === 'paciente' && appointment.patientUserId === user.sub) ||
    (user.role === 'medico' && appointment.doctorUserId === user.sub)
  );
}

function canUseVideoRoom(user, appointment) {
  return canManageRoom(user, appointment);
}

function canUseVideoMessages(user, appointment) {
  if (canManageRoom(user, appointment)) {
    return true;
  }

  return (
    user.role === 'comisionista' &&
    appointment.commissionAgentUserId === user.sub &&
    appointment.requiresCommissionAgentInChat &&
    appointment.commissionAgentChatRequestStatus === 'aceptada'
  );
}

function ensureRoomAccessWindow(session, appointment, user) {
  if (user.role === 'administrador') {
    return;
  }

  const now = new Date();
  const startsAt = new Date(session.accessStartsAt || calculateAccessWindow(appointment).accessStartsAt);
  const endsAt = new Date(session.accessEndsAt || calculateAccessWindow(appointment).accessEndsAt);

  if (now < startsAt || now > endsAt) {
    throw new AppError('Video session is not available in the current time window', 409, {
      accessStartsAt: startsAt.toISOString(),
      accessEndsAt: endsAt.toISOString()
    });
  }
}

async function ensureVirtualConfirmedAppointment(appointmentId) {
  validateAppointmentId(appointmentId);
  const appointment = await videoConsultationRepository.findAppointmentContext(appointmentId);

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (appointment.careChannel !== 'virtual') {
    throw new AppError('Video consultation is only available for virtual appointments', 409);
  }

  if (!['confirmada', 'en_curso', 'completada'].includes(appointment.status)) {
    throw new AppError('Video consultation can only be created for confirmed appointments', 409);
  }

  return appointment;
}

async function buildVideoSessionResponse(session, appointment, user, includeAccess = true) {
  const response = {
    ...session,
    appointment: {
      id: appointment.id,
      status: appointment.status,
      patient: appointment.patient,
      doctor: appointment.doctor,
      specialty: appointment.doctorSpecialties?.join(', ') || '',
      reason: appointment.reason,
      scheduledStartAt: appointment.scheduledStartAt,
      scheduledEndAt: appointment.scheduledEndAt,
      careChannel: appointment.careChannel
    },
    accessWindow: {
      startsAt: session.accessStartsAt,
      endsAt: session.accessEndsAt
    }
  };

  if (!includeAccess) {
    return response;
  }

  const expiresAt = calculateTokenExpiry(appointment);
  const participantRole =
    user.role === 'medico'
      ? 'doctor'
      : user.role === 'paciente'
        ? 'patient'
        : user.role === 'administrador'
          ? 'admin'
          : 'observer';

  const access = await videoProvider.issueAccessToken({
    providerRoomId: session.providerRoomId,
    appointmentId: appointment.id,
    userId: user.sub,
    role: participantRole,
    expiresAt
  });

  return {
    ...response,
    access
  };
}

async function sendVideoAvailabilityNotifications(appointment, session, actorUserId) {
  const teleconsultUrl = `${env.notifications.appBaseUrl.replace(/\/$/, '')}/teleconsulta/${appointment.id}`;
  const message = `La videoconsulta de tu cita con ${appointment.doctor} ya esta lista. Podras ingresar entre ${new Date(session.accessStartsAt).toLocaleString('es-CO')} y ${new Date(session.accessEndsAt).toLocaleString('es-CO')}. Acceso: ${teleconsultUrl}`;

  await Promise.all([
    notificationsService.sendCustomNotification({
      userId: appointment.patientUserId,
      appointmentId: appointment.id,
      eventType: 'videoconsulta_disponible',
      typePrefix: 'videoconsulta_disponible',
      message,
      metadata: {
        videoConsultationId: session.id,
        teleconsultUrl
      },
      actorUserId
    }),
    notificationsService.sendCustomNotification({
      userId: appointment.doctorUserId,
      appointmentId: appointment.id,
      eventType: 'videoconsulta_disponible',
      typePrefix: 'videoconsulta_disponible',
      message: `La videoconsulta con ${appointment.patient} ya esta preparada. Acceso: ${teleconsultUrl}`,
      metadata: {
        videoConsultationId: session.id,
        teleconsultUrl
      },
      actorUserId
    })
  ]);
}

async function prepareVideoSession(appointmentId, user) {
  const appointment = await ensureVirtualConfirmedAppointment(appointmentId);

  if (!canManageRoom(user, appointment)) {
    throw new AppError('You do not have permission to access this resource', 403);
  }

  let session = await videoConsultationRepository.findVideoConsultationByAppointmentId(appointmentId);

  if (session && ['cancelled', 'expired', 'failed'].includes(session.status)) {
    throw new AppError('Video consultation is not available for this appointment', 409);
  }

  if (!session) {
    const accessWindow = calculateAccessWindow(appointment);
    const room = await videoProvider.ensureRoom({ appointmentId });
    session = await videoConsultationRepository.createVideoConsultation({
      appointmentId,
      provider: room.provider,
      providerRoomId: room.providerRoomId,
      roomUrl: room.roomUrl,
      status: 'ready',
      accessStartsAt: accessWindow.accessStartsAt,
      accessEndsAt: accessWindow.accessEndsAt,
      metadata: {
        providerMetadata: room.metadata,
        appointmentStatusAtCreation: appointment.status
      }
    });

    await writeAudit({
      actorUserId: user.sub,
      entity: 'video_consulta',
      entityId: session.id,
      action: 'crear_sesion_videoconsulta',
      newValues: { appointmentId, provider: session.provider }
    });

    await sendVideoAvailabilityNotifications(appointment, session, user.sub);
  }

  return buildVideoSessionResponse(session, appointment, user, false);
}

async function getVideoSessionByAppointment(appointmentId, user) {
  const appointment = await ensureVirtualConfirmedAppointment(appointmentId);
  const session = await videoConsultationRepository.findVideoConsultationByAppointmentId(appointmentId);

  if (!session) {
    throw new AppError('Video consultation session has not been prepared yet', 404);
  }

  if (!canUseVideoRoom(user, appointment)) {
    throw new AppError('You do not have permission to access this resource', 403);
  }

  if (['cancelled', 'expired', 'failed'].includes(session.status)) {
    throw new AppError('Video consultation is no longer available', 409);
  }

  ensureRoomAccessWindow(session, appointment, user);

  await writeAudit({
    actorUserId: user.sub,
    entity: 'video_consulta',
    entityId: session.id,
    action: 'consultar_acceso_videoconsulta',
    newValues: { appointmentId }
  });

  return buildVideoSessionResponse(session, appointment, user, true);
}

async function startVideoSession(videoConsultationId, user) {
  validateVideoConsultationId(videoConsultationId);
  const session = await videoConsultationRepository.findVideoConsultationById(videoConsultationId);

  if (!session) {
    throw new AppError('Video consultation not found', 404);
  }

  const appointment = await ensureVirtualConfirmedAppointment(session.appointmentId);

  if (!canUseVideoRoom(user, appointment)) {
    throw new AppError('You do not have permission to access this resource', 403);
  }

  ensureRoomAccessWindow(session, appointment, user);

  if (session.status === 'completed') {
    throw new AppError('Video consultation has already ended', 409);
  }

  const updatedSession =
    session.status === 'in_progress'
      ? session
      : await videoConsultationRepository.updateVideoConsultation(videoConsultationId, {
          status: 'in_progress',
          startedAt: session.startedAt || new Date()
        });

  if (appointment.status === 'confirmada') {
    await videoConsultationRepository.updateAppointmentStatus(appointment.id, 'en_curso');
  }

  await videoConsultationRepository.createVideoMessage({
    videoConsultationId,
    senderUserId: user.sub,
    senderRole: user.role,
    type: 'sistema',
    content: `La videoconsulta fue iniciada por ${user.role}.`,
    metadata: { autoGenerated: true }
  });

  await writeAudit({
    actorUserId: user.sub,
    entity: 'video_consulta',
    entityId: videoConsultationId,
    action: 'iniciar_videoconsulta',
    newValues: { status: 'in_progress' }
  });

  return buildVideoSessionResponse(updatedSession, { ...appointment, status: 'en_curso' }, user, true);
}

async function endVideoSession(videoConsultationId, user) {
  validateVideoConsultationId(videoConsultationId);
  const session = await videoConsultationRepository.findVideoConsultationById(videoConsultationId);

  if (!session) {
    throw new AppError('Video consultation not found', 404);
  }

  const appointment = await ensureVirtualConfirmedAppointment(session.appointmentId);

  if (!['medico', 'administrador'].includes(user.role)) {
    throw new AppError('You do not have permission to end this video consultation', 403);
  }

  if (!canManageRoom(user, appointment)) {
    throw new AppError('You do not have permission to access this resource', 403);
  }

  const updatedSession = await videoConsultationRepository.updateVideoConsultation(videoConsultationId, {
    status: 'completed',
    endedAt: new Date()
  });

  await videoConsultationRepository.updateAppointmentStatus(appointment.id, 'completada');

  await videoConsultationRepository.createVideoMessage({
    videoConsultationId,
    senderUserId: user.sub,
    senderRole: user.role,
    type: 'sistema',
    content: 'La videoconsulta finalizo correctamente.',
    metadata: { autoGenerated: true }
  });

  await writeAudit({
    actorUserId: user.sub,
    entity: 'video_consulta',
    entityId: videoConsultationId,
    action: 'finalizar_videoconsulta',
    newValues: { status: 'completed' }
  });

  return buildVideoSessionResponse(updatedSession, { ...appointment, status: 'completada' }, user, false);
}

async function listVideoMessages(videoConsultationId, user) {
  validateVideoConsultationId(videoConsultationId);
  const session = await videoConsultationRepository.findVideoConsultationById(videoConsultationId);

  if (!session) {
    throw new AppError('Video consultation not found', 404);
  }

  const appointment = await ensureVirtualConfirmedAppointment(session.appointmentId);

  if (!canUseVideoMessages(user, appointment)) {
    throw new AppError('You do not have permission to access this resource', 403);
  }

  return videoConsultationRepository.listVideoMessages(videoConsultationId);
}

async function sendVideoMessage(videoConsultationId, payload, user) {
  validateVideoConsultationId(videoConsultationId);
  validateVideoMessage(payload);
  const session = await videoConsultationRepository.findVideoConsultationById(videoConsultationId);

  if (!session) {
    throw new AppError('Video consultation not found', 404);
  }

  const appointment = await ensureVirtualConfirmedAppointment(session.appointmentId);

  if (!canUseVideoMessages(user, appointment)) {
    throw new AppError('You do not have permission to access this resource', 403);
  }

  const message = await videoConsultationRepository.createVideoMessage({
    videoConsultationId,
    senderUserId: user.sub,
    senderRole: user.role,
    type: 'texto',
    content: String(payload.content).trim(),
    metadata: payload.metadata || null
  });

  await writeAudit({
    actorUserId: user.sub,
    entity: 'mensaje_video_consulta',
    entityId: message.id,
    action: 'enviar_mensaje_videoconsulta',
    newValues: { videoConsultationId }
  });

  return message;
}

async function listVideoConsultations(filters, user) {
  if (user.role !== 'administrador') {
    throw new AppError('You do not have permission to access this resource', 403);
  }

  const pagination = getPagination(filters);
  const result = await videoConsultationRepository.listVideoConsultations({
    ...filters,
    limit: pagination.limit,
    offset: pagination.offset
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

async function invalidateVideoSessionForAppointment(appointmentId, nextStatus, actorUserId = null) {
  const session = await videoConsultationRepository.findVideoConsultationByAppointmentId(appointmentId);
  if (!session) {
    return null;
  }

  const finalStatus =
    nextStatus === 'reprogramada'
      ? 'expired'
      : nextStatus === 'completada'
        ? 'completed'
        : 'cancelled';
  const updated = await videoConsultationRepository.updateVideoConsultation(session.id, {
    status: finalStatus,
    endedAt: finalStatus === 'completed' || finalStatus === 'cancelled' ? new Date() : null
  });

  await writeAudit({
    actorUserId,
    entity: 'video_consulta',
    entityId: session.id,
    action: 'invalidar_videoconsulta_por_cita',
    newValues: { appointmentId, status: finalStatus }
  });

  return updated;
}

module.exports = {
  endVideoSession,
  getVideoSessionByAppointment,
  invalidateVideoSessionForAppointment,
  listVideoConsultations,
  listVideoMessages,
  prepareVideoSession,
  sendVideoMessage,
  startVideoSession
};
