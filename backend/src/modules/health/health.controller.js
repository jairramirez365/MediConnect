const healthService = require('./health.service');

async function getHealth(req, res) {
  const result = await healthService.getHealthStatus();
  res.status(200).json(result);
}

module.exports = {
  getHealth
};
