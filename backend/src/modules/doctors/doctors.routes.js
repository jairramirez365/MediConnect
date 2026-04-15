const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const authorizeRoles = require('../../middlewares/authorizeRoles');
const asyncHandler = require('../../utils/asyncHandler');
const availabilityController = require('../availability/availability.controller');
const doctorsController = require('./doctors.controller');

const router = express.Router();

router.get('/', asyncHandler(doctorsController.searchDoctors));

router.get('/:doctorId/availability', asyncHandler(availabilityController.getDoctorAvailability));

router.post(
  '/me/documents',
  authenticate,
  authorizeRoles('medico'),
  asyncHandler(doctorsController.uploadMedicalDocument)
);

router.get(
  '/pending-review',
  authenticate,
  authorizeRoles('administrador'),
  asyncHandler(doctorsController.listDoctorsPendingReview)
);

router.patch(
  '/:doctorId/documents/:documentId/review',
  authenticate,
  authorizeRoles('administrador'),
  asyncHandler(doctorsController.reviewMedicalDocument)
);

router.patch(
  '/:doctorId/approve',
  authenticate,
  authorizeRoles('administrador'),
  asyncHandler(doctorsController.approveDoctor)
);

router.patch(
  '/:doctorId/reject',
  authenticate,
  authorizeRoles('administrador'),
  asyncHandler(doctorsController.rejectDoctor)
);

module.exports = router;
