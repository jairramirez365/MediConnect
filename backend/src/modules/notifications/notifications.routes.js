const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const authorizeRoles = require('../../middlewares/authorizeRoles');
const asyncHandler = require('../../utils/asyncHandler');
const notificationsController = require('./notifications.controller');

const router = express.Router();

router.use(authenticate);

router.get('/me', asyncHandler(notificationsController.listMine));
router.get('/me/unread-summary', asyncHandler(notificationsController.getUnreadSummary));
router.get('/me/:id', asyncHandler(notificationsController.getMine));
router.patch('/me/:id/read', asyncHandler(notificationsController.markMineRead));

router.get('/admin/history', authorizeRoles('administrador'), asyncHandler(notificationsController.listAdmin));
router.post('/admin/:id/retry', authorizeRoles('administrador'), asyncHandler(notificationsController.retry));
router.post('/admin/run-jobs', authorizeRoles('administrador'), asyncHandler(notificationsController.runScheduler));

module.exports = router;
