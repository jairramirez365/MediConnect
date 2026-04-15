const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const authorizeRoles = require('../../middlewares/authorizeRoles');
const asyncHandler = require('../../utils/asyncHandler');
const specialtiesController = require('./specialties.controller');

const router = express.Router();

router.get('/', asyncHandler(specialtiesController.listSpecialties));

router.post(
  '/',
  authenticate,
  authorizeRoles('administrador'),
  asyncHandler(specialtiesController.createSpecialty)
);

router.patch(
  '/:id',
  authenticate,
  authorizeRoles('administrador'),
  asyncHandler(specialtiesController.updateSpecialty)
);

router.delete(
  '/:id',
  authenticate,
  authorizeRoles('administrador'),
  asyncHandler(specialtiesController.deleteSpecialty)
);

router.post(
  '/me',
  authenticate,
  authorizeRoles('medico'),
  asyncHandler(specialtiesController.assignMySpecialty)
);

router.post(
  '/doctors/:doctorId',
  authenticate,
  authorizeRoles('administrador'),
  asyncHandler(specialtiesController.assignSpecialtyToDoctor)
);

router.delete(
  '/doctors/:doctorId/:specialtyId',
  authenticate,
  authorizeRoles('administrador'),
  asyncHandler(specialtiesController.removeSpecialtyFromDoctor)
);

module.exports = router;
