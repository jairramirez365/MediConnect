const healthRepository = require('./health.repository');

async function getHealthStatus() {
  const database = await healthRepository.checkDatabaseConnection();

  return {
    status: 'ok',
    database
  };
}

module.exports = {
  getHealthStatus
};
