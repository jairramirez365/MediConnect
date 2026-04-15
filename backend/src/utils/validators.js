const AppError = require('./AppError');

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function requireFields(payload, fields) {
  const missingFields = fields.filter((field) => payload[field] === undefined || payload[field] === null || payload[field] === '');

  if (missingFields.length > 0) {
    throw new AppError('Validation error', 400, {
      missingFields
    });
  }
}

module.exports = {
  isUuid,
  requireFields
};
