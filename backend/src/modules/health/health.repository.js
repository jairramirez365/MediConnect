const { query } = require('../../database/query');

async function checkDatabaseConnection() {
  const result = await query('SELECT NOW() AS current_time');
  return result.rows[0];
}

module.exports = {
  checkDatabaseConnection
};
