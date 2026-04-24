const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const authorizeRoles = require('../../middlewares/authorizeRoles');
const asyncHandler = require('../../utils/asyncHandler');
const appointmentsController = require('./appointments.controller');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  authorizeRoles('paciente', 'medico', 'comisionista', 'administrador'),
  asyncHandler(appointmentsController.listAppointments)
);

router.get(
  '/:id',
  authorizeRoles('paciente', 'medico', 'comisionista', 'administrador'),
  asyncHandler(appointmentsController.getAppointmentDetail)
);

router.post(
  '/',
  authorizeRoles('paciente', 'comisionista', 'administrador'),
  asyncHandler(appointmentsController.createAppointment)
);

router.patch(
  '/:id/status',
  authorizeRoles('administrador'),
  asyncHandler(appointmentsController.updateAppointmentStatus)
);

router.patch(
  '/:id/confirm',
  authorizeRoles('medico', 'administrador'),
  asyncHandler(appointmentsController.confirmAppointment)
);

router.patch(
  '/:id/commission-agent-chat-response',
  authorizeRoles('paciente', 'administrador'),
  asyncHandler(appointmentsController.respondCommissionAgentChatRequest)
);

router.patch(
  '/:id/cancel',
  authorizeRoles('paciente', 'medico', 'administrador'),
  asyncHandler(appointmentsController.cancelAppointment)
);

router.patch(
  '/:id/reschedule',
  authorizeRoles('paciente', 'medico', 'administrador'),
  asyncHandler(appointmentsController.rescheduleAppointment)
);

router.patch(
  '/:id/complete',
  authorizeRoles('medico', 'administrador'),
  asyncHandler(appointmentsController.completeAppointment)
);

module.exports = router;
