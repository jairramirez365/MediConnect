const crypto = require('crypto');
const AppError = require('../../utils/AppError');
const env = require('../../config/env');
const { signAccessToken } = require('../../utils/token');
const { writeAudit } = require('../../utils/audit');
const verificationRepository = require('./auth.verification.repository');
const notificationsRepository = require('../notifications/notifications.repository');
const { dispatchNotification } = require('../notifications/providers');

function generateOtpCode() {
  const max = 10 ** env.verification.otpLength;
  return String(Math.floor(Math.random() * max)).padStart(env.verification.otpLength, '0');
}

function hashOtpCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function generateSecureToken() {
  return crypto.randomBytes(24).toString('hex');
}

function buildVerificationMessage(channel, code, verificationLink) {
  if (channel === 'email') {
    return `Tu codigo de verificacion MediConnect es ${code}. Si prefieres, tambien puedes abrir este enlace seguro: ${verificationLink}`;
  }

  return `Tu codigo de verificacion MediConnect es ${code}. Si no solicitaste este proceso, ignora este mensaje.`;
}

async function createAndDispatchVerification(user, channel, metadata = {}) {
  const destination = channel === 'email' ? user.email : user.phone;

  if (!destination) {
    return null;
  }

  const code = generateOtpCode();
  const secureToken = generateSecureToken();
  const expiresAt = new Date(Date.now() + env.verification.otpExpiresInMinutes * 60 * 1000);
  const verificationLink = `${env.notifications.appBaseUrl.replace(/\/$/, '')}/verificar?userId=${user.id}&channel=${channel}&token=${secureToken}`;
  const codeHash = hashOtpCode(code);

  await verificationRepository.cancelPendingVerifications(user.id, channel);
  const verification = await verificationRepository.createVerification({
    userId: user.id,
    channel,
    destination,
    codeHash,
    secureToken,
    maxAttempts: env.verification.maxValidationAttempts,
    maxResends: env.verification.maxResends,
    expiresAt,
    metadata: env.nodeEnv === 'test' ? { ...metadata, debugCode: code } : metadata
  });

  const message = buildVerificationMessage(channel, code, verificationLink);
  const delivery = await dispatchNotification(channel, {
    destination,
    subject: 'MediConnect · Verificacion de cuenta',
    message
  });

  await notificationsRepository.createNotification(notificationsRepository, {
    userId: user.id,
    type: `verificacion_${channel}`,
    eventType: 'verificacion_cuenta',
    channel,
    destination,
    provider: delivery.provider,
    message,
    status: delivery.status,
    attemptsCount: 1,
    scheduledAt: new Date(),
    sentAt: new Date(),
    deliveredAt: delivery.deliveredAt,
    metadata: {
      verificationId: verification.id,
      maskedDestination: destination
    }
  });

  return verification;
}

async function issueInitialVerifications(user, preferredPhoneChannel) {
  const channels = ['email'];
  if (user.phone) {
    channels.push(preferredPhoneChannel || env.verification.preferredPhoneChannel);
  }

  for (const channel of channels) {
    await createAndDispatchVerification(user, channel);
  }

  return getVerificationStatus(user.id);
}

async function getVerificationStatus(userId) {
  const status = await verificationRepository.getVerificationStatus(userId);

  if (!status) {
    throw new AppError('Verification status not found', 404);
  }

  return {
    ...status,
    allVerified: Boolean(status.emailVerifiedAt && (!status.phone || status.phoneVerifiedAt))
  };
}

async function resendVerification(payload) {
  const user = await verificationRepository.findUserByIdentifier(payload.userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const channel = payload.channel || (user.phone ? env.verification.preferredPhoneChannel : 'email');
  const currentVerification = await verificationRepository.findActiveVerification(user.id, channel);

  if (currentVerification && currentVerification.resendCount >= currentVerification.maxResends) {
    throw new AppError('Resend limit reached for this verification channel', 429);
  }

  const nextVerification = await createAndDispatchVerification(user, channel, {
    resendOf: currentVerification?.id || null
  });

  if (currentVerification) {
    await verificationRepository.incrementResendAttempt(currentVerification.id, nextVerification.expiresAt);
  }

  return getVerificationStatus(user.id);
}

async function verifyContact(payload) {
  const user = await verificationRepository.findUserByIdentifier(payload.userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const verification = await verificationRepository.findActiveVerification(user.id, payload.channel);

  if (!verification) {
    throw new AppError('No verification request found for this channel', 404);
  }

  if (verification.status === 'verificada') {
    return {
      status: await getVerificationStatus(user.id),
      accessToken: user.status === 'activo' ? signAccessToken({ sub: user.id, email: user.email, role: user.role, status: user.status }) : null
    };
  }

  if (verification.blockedUntil && new Date(verification.blockedUntil) > new Date()) {
    throw new AppError('Verification temporarily blocked for too many attempts', 429, {
      blockedUntil: verification.blockedUntil
    });
  }

  if (new Date(verification.expiresAt) < new Date()) {
    throw new AppError('Verification code has expired', 410);
  }

  const codeMatches = payload.code && hashOtpCode(String(payload.code)) === verification.codeHash;
  const tokenMatches = payload.token && payload.token === verification.secureToken;

  if (!codeMatches && !tokenMatches) {
    const willBlock = verification.attemptsCount + 1 >= verification.maxAttempts;
    await verificationRepository.incrementVerificationAttempt(verification.id, {
      status: willBlock ? 'bloqueada' : 'pendiente',
      blockedUntil: willBlock ? new Date(Date.now() + env.verification.lockMinutes * 60 * 1000) : null
    });
    throw new AppError('Invalid verification code or token', 400);
  }

  await verificationRepository.markVerificationCompleted(verification.id);
  const updatedUser = await verificationRepository.markUserChannelVerified(user.id, payload.channel);
  const status = await getVerificationStatus(user.id);

  await writeAudit({
    actorUserId: user.id,
    entity: 'verificacion_contacto',
    entityId: verification.id,
    action: 'verificar_canal_cuenta',
    newValues: { channel: payload.channel, status: 'verificada' }
  });

  return {
    status,
    accessToken:
      updatedUser.status === 'activo'
        ? signAccessToken({
            sub: updatedUser.id,
            email: updatedUser.email,
            role: updatedUser.role,
            status: updatedUser.status
          })
        : null
  };
}

module.exports = {
  getVerificationStatus,
  issueInitialVerifications,
  resendVerification,
  verifyContact
};
