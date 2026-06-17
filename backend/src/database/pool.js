const { Pool } = require('pg');

const env = require('../config/env');
const logger = require('../config/logger');

const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.database,
  user: env.db.user,
  password: env.db.password,
  ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('connect', () => {
  logger.info('PostgreSQL pool connected');
});

pool.on('error', (error) => {
  logger.error('Unexpected PostgreSQL pool error', {
    error: error.message
  });
});

module.exports = pool;
