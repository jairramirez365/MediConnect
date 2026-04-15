const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const authorizeRoles = require('../../middlewares/authorizeRoles');
const asyncHandler = require('../../utils/asyncHandler');
const paymentsController = require('./payments.controller');

const router = express.Router();

router.use(authenticate);

router.post(
  '/appointments/:appointmentId/dummy',
  authorizeRoles('paciente', 'administrador'),
  asyncHandler(paymentsController.createDummyPayment)
);

module.exports = router;
