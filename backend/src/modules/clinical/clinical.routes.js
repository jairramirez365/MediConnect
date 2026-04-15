const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const authorizeRoles = require('../../middlewares/authorizeRoles');
const asyncHandler = require('../../utils/asyncHandler');
const clinicalController = require('./clinical.controller');

const router = express.Router();

router.use(authenticate);

router.get('/medical-records/me', authorizeRoles('paciente'), asyncHandler(clinicalController.listMyMedicalRecords));
router.get('/medical-records/patients/:patientId', authorizeRoles('medico', 'administrador'), asyncHandler(clinicalController.listPatientMedicalRecords));
router.post('/appointments/:appointmentId/notes', authorizeRoles('medico', 'administrador'), asyncHandler(clinicalController.createClinicalNote));
router.post('/appointments/:appointmentId/prescriptions', authorizeRoles('medico', 'administrador'), asyncHandler(clinicalController.createPrescription));
router.get('/prescriptions/me', authorizeRoles('paciente'), asyncHandler(clinicalController.listMyPrescriptions));

module.exports = router;
