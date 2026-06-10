const path = require('path');
const dotenv = require('dotenv');


dotenv.config({
  path: path.resolve(__dirname, '../../.env')
});

const requiredVariables = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];

requiredVariables.forEach((variableName) => {
  if (!process.env[variableName]) {
    throw new Error(`Missing required environment variable: ${variableName}`);
  }
});

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    accessTokenExpiresInSeconds: Number(process.env.JWT_EXPIRES_IN_SECONDS || 86400)
  },
  cors: {
    allowedOrigins: (process.env.CORS_ORIGINS || '*').split(',').map((origin) => origin.trim())
  },
  rateLimit: {
    authWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 60000),
    authMaxRequests: Number(process.env.AUTH_RATE_LIMIT_MAX || 20)
  },
  verification: {
    otpLength: Number(process.env.VERIFICATION_OTP_LENGTH || 6),
    otpExpiresInMinutes: Number(process.env.VERIFICATION_OTP_EXPIRES_MINUTES || 10),
    maxValidationAttempts: Number(process.env.VERIFICATION_MAX_ATTEMPTS || 5),
    maxResends: Number(process.env.VERIFICATION_MAX_RESENDS || 5),
    lockMinutes: Number(process.env.VERIFICATION_LOCK_MINUTES || 15),
    preferredPhoneChannel: process.env.VERIFICATION_PHONE_CHANNEL || 'whatsapp'
  },
  notifications: {
    provider: process.env.NOTIFICATIONS_PROVIDER || 'mock',
    appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5173',
    supportPhone: process.env.SUPPORT_PHONE || '',
    supportEmail: process.env.SUPPORT_EMAIL || '',
    schedulerEnabled: process.env.NOTIFICATIONS_SCHEDULER_ENABLED !== 'false',
    schedulerIntervalMs: Number(process.env.NOTIFICATIONS_SCHEDULER_INTERVAL_MS || 60000)
  },
  providers: {
    email: {
      fromName: process.env.EMAIL_FROM_NAME || 'MediConnect',
      fromAddress: process.env.EMAIL_FROM_ADDRESS || 'no-reply@mediconnect.local',
      apiKey: process.env.EMAIL_PROVIDER_API_KEY || ''
    },
    sms: {
      apiKey: process.env.SMS_PROVIDER_API_KEY || '',
      sender: process.env.SMS_PROVIDER_SENDER || 'MediConnect'
    },
    whatsapp: {
      apiKey: process.env.WHATSAPP_PROVIDER_API_KEY || '',
      sender: process.env.WHATSAPP_PROVIDER_SENDER || 'MediConnect'
    }
  },
  video: {
    provider: process.env.VIDEO_PROVIDER || 'mock',
    apiKey: process.env.VIDEO_API_KEY || '',
    apiSecret: process.env.VIDEO_API_SECRET || '',
    baseUrl: process.env.VIDEO_BASE_URL || (process.env.APP_BASE_URL || 'http://localhost:5173'),
    tokenTtlMinutes: Number(process.env.VIDEO_TOKEN_TTL_MINUTES || 60),
    accessWindowMinutes: Number(process.env.VIDEO_ACCESS_WINDOW_MINUTES || 10)
  }
};
