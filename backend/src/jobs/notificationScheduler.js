const env = require('../config/env');
const logger = require('../config/logger');
const notificationsService = require('../modules/notifications/notifications.service');

let intervalRef = null;

function startNotificationScheduler() {
  if (!env.notifications.schedulerEnabled || intervalRef) {
    return;
  }

  intervalRef = setInterval(async () => {
    try {
      await notificationsService.processAppointmentReminders();
    } catch (error) {
      logger.error('Notification scheduler failed', {
        error: error.message
      });
    }
  }, env.notifications.schedulerIntervalMs);

  logger.info('Notification scheduler started', {
    intervalMs: env.notifications.schedulerIntervalMs
  });
}

module.exports = {
  startNotificationScheduler
};
