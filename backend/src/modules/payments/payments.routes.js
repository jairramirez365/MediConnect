const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const authorizeRoles = require('../../middlewares/authorizeRoles');
const asyncHandler = require('../../utils/asyncHandler');
const paymentsController = require('./payments.controller');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  authorizeRoles('paciente', 'medico', 'comisionista', 'administrador'),
  asyncHandler(paymentsController.listPayments)
);

router.get(
  '/summary',
  authorizeRoles('paciente', 'medico', 'comisionista', 'administrador'),
  asyncHandler(paymentsController.getPaymentsSummary)
);

router.get(
  '/payable-appointments',
  authorizeRoles('paciente'),
  asyncHandler(paymentsController.listPayableAppointments)
);

router.post(
  '/appointments/:appointmentId/pse-checkout',
  authorizeRoles('paciente', 'administrador'),
  asyncHandler(paymentsController.createPseCheckout)
);

router.post(
  '/:paymentId/simulate-success',
  authorizeRoles('paciente', 'administrador'),
  asyncHandler(paymentsController.confirmStagingPsePayment)
);

router.post(
  '/appointments/:appointmentId/dummy',
  authorizeRoles('paciente', 'administrador'),
  asyncHandler(paymentsController.createDummyPayment)
);

module.exports = router;
