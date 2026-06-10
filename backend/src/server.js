const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { startNotificationScheduler } = require('./jobs/notificationScheduler');

app.listen(env.port, () => {
  logger.info('HTTP server started', {
    port: env.port,
    environment: env.nodeEnv
  });

  startNotificationScheduler();
});
