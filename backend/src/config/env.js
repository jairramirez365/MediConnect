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
  }
};
