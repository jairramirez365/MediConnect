const AppError = require('../utils/AppError');

function rateLimit({ windowMs, maxRequests }) {
  const buckets = new Map();

  return (req, res, next) => {
    const key = `${req.ip}:${req.originalUrl}`;
    const now = Date.now();
    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(maxRequests - bucket.count, 0)));

    if (bucket.count > maxRequests) {
      next(new AppError('Too many requests', 429));
      return;
    }

    next();
  };
}

module.exports = rateLimit;
