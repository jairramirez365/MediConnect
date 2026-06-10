const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const authorizeRoles = require('../../middlewares/authorizeRoles');
const asyncHandler = require('../../utils/asyncHandler');
const videoConsultationController = require('./videoConsultation.controller');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  authorizeRoles('administrador'),
  asyncHandler(videoConsultationController.listVideoConsultations)
);

router.post(
  '/:id/start',
  authorizeRoles('paciente', 'medico', 'administrador'),
  asyncHandler(videoConsultationController.startVideoSession)
);

router.post(
  '/:id/end',
  authorizeRoles('medico', 'administrador'),
  asyncHandler(videoConsultationController.endVideoSession)
);

router.get(
  '/:id/messages',
  authorizeRoles('paciente', 'medico', 'comisionista', 'administrador'),
  asyncHandler(videoConsultationController.listVideoMessages)
);

router.post(
  '/:id/messages',
  authorizeRoles('paciente', 'medico', 'comisionista', 'administrador'),
  asyncHandler(videoConsultationController.sendVideoMessage)
);

module.exports = router;
