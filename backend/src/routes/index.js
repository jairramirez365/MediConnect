const express = require('express');

const appointmentsRoutes = require('../modules/appointments/appointments.routes');
const authRoutes = require('../modules/auth/auth.routes');
const availabilityRoutes = require('../modules/availability/availability.routes');
const clinicalRoutes = require('../modules/clinical/clinical.routes');
const doctorsRoutes = require('../modules/doctors/doctors.routes');
const healthRoutes = require('../modules/health/health.routes');
const paymentsRoutes = require('../modules/payments/payments.routes');
const profilesRoutes = require('../modules/profiles/profiles.routes');
const specialtiesRoutes = require('../modules/specialties/specialties.routes');
const usersRoutes = require('../modules/users/users.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/availability', availabilityRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/clinical', clinicalRoutes);
router.use('/payments', paymentsRoutes);
router.use('/profiles', profilesRoutes);
router.use('/doctors', doctorsRoutes);
router.use('/specialties', specialtiesRoutes);
router.use('/users', usersRoutes);

module.exports = router;
