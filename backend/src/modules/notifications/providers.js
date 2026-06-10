const crypto = require('crypto');
const env = require('../../config/env');
const logger = require('../../config/logger');

function buildMockResponse(channel, destination, message) {
  const providerMessageId = crypto.randomUUID();

  logger.info('Notification dispatched in mock mode', {
    channel,
    destination,
    provider: env.notifications.provider,
    providerMessageId,
    preview: message.slice(0, 180)
  });

  return {
    status: 'enviada',
    provider: env.notifications.provider,
    providerMessageId,
    deliveredAt: new Date()
  };
}

async function sendEmail({ destination, subject, message }) {
  return buildMockResponse('email', destination, `${subject}\n${message}`);
}

async function sendSms({ destination, message }) {
  return buildMockResponse('sms', destination, message);
}

async function sendWhatsApp({ destination, message }) {
  return buildMockResponse('whatsapp', destination, message);
}

async function sendInternal() {
  return {
    status: 'enviada',
    provider: 'interno',
    providerMessageId: null,
    deliveredAt: new Date()
  };
}

async function dispatchNotification(channel, payload) {
  if (channel === 'interno') {
    return sendInternal(payload);
  }

  if (channel === 'email') {
    return sendEmail(payload);
  }

  if (channel === 'sms') {
    return sendSms(payload);
  }

  if (channel === 'whatsapp') {
    return sendWhatsApp(payload);
  }

  throw new Error(`Unsupported notification channel: ${channel}`);
}

module.exports = {
  dispatchNotification
};
