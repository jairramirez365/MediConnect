const notificationsService = require('./notifications.service');

async function listMine(req, res) {
  const result = await notificationsService.listMyNotifications(req.query, req.user);
  res.status(200).json(result);
}

async function getMine(req, res) {
  const notification = await notificationsService.getMyNotification(req.params.id, req.user);
  res.status(200).json({ data: notification });
}

async function markMineRead(req, res) {
  const notification = await notificationsService.markMyNotificationRead(req.params.id, req.user);
  res.status(200).json({ message: 'Notification marked as read', data: notification });
}

async function getUnreadSummary(req, res) {
  const summary = await notificationsService.getUnreadSummary(req.user);
  res.status(200).json({ data: summary });
}

async function listAdmin(req, res) {
  const result = await notificationsService.listNotificationsAdmin(req.query, req.user);
  res.status(200).json(result);
}

async function retry(req, res) {
  const notification = await notificationsService.retryNotification(req.params.id, req.user);
  res.status(200).json({ message: 'Notification retried successfully', data: notification });
}

async function runScheduler(req, res) {
  await notificationsService.processAppointmentReminders();
  res.status(200).json({ message: 'Notification scheduler executed successfully' });
}

module.exports = {
  getMine,
  getUnreadSummary,
  listAdmin,
  listMine,
  markMineRead,
  retry,
  runScheduler
};
