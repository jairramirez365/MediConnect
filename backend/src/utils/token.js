const crypto = require('crypto');

const env = require('../config/env');
const AppError = require('./AppError');

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function signAccessToken(payload) {
  const now = Math.floor(Date.now() / 1000);
  const expiresInSeconds = env.auth.accessTokenExpiresInSeconds;

  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedBody = base64UrlEncode(body);
  const signature = crypto
    .createHmac('sha256', env.auth.jwtSecret)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedBody}.${signature}`;
}

function verifyAccessToken(token) {
  const [encodedHeader, encodedBody, signature] = String(token || '').split('.');

  if (!encodedHeader || !encodedBody || !signature) {
    throw new AppError('Invalid token', 401);
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.auth.jwtSecret)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new AppError('Invalid token signature', 401);
  }

  const payload = base64UrlDecode(encodedBody);

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new AppError('Token expired', 401);
  }

  return payload;
}

module.exports = {
  signAccessToken,
  verifyAccessToken
};
