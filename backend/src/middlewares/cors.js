const env = require('../config/env');

function cors(req, res, next) {
  const origin = req.headers.origin;
  const allowedOrigins = env.cors.allowedOrigins;

  if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}

module.exports = cors;
