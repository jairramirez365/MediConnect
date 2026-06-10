const crypto = require('crypto');
const env = require('../../config/env');

function buildMockToken(payload, expiresAt) {
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Math.floor(new Date(expiresAt).getTime() / 1000)
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', env.auth.jwtSecret)
    .update(body)
    .digest('base64url');

  return `${body}.${signature}`;
}

function buildMockRoomUrl(providerRoomId) {
  return `${env.video.baseUrl.replace(/\/$/, '')}/teleconsulta/sala/${providerRoomId}`;
}

async function ensureRoom({ appointmentId, existingRoomId = null }) {
  const providerRoomId = existingRoomId || `mock-room-${appointmentId}`;

  return {
    provider: 'mock',
    providerRoomId,
    roomUrl: buildMockRoomUrl(providerRoomId),
    metadata: {
      mode: 'mock',
      simulated: true
    }
  };
}

async function issueAccessToken({ providerRoomId, appointmentId, userId, role, expiresAt }) {
  return {
    accessToken: buildMockToken(
      {
        provider: 'mock',
        providerRoomId,
        appointmentId,
        userId,
        role
      },
      expiresAt
    ),
    joinUrl: buildMockRoomUrl(providerRoomId),
    expiresAt
  };
}

function getProviderService() {
  return {
    ensureRoom,
    issueAccessToken
  };
}

module.exports = {
  getProviderService
};
