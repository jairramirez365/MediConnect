const express = require('express');

const appointmentsRoutes = require('../modules/appointments/appointments.routes');
const authRoutes = require('../modules/auth/auth.routes');
const availabilityRoutes = require('../modules/availability/availability.routes');
const chatRoutes = require('../modules/chat/chat.routes');
const clinicalRoutes = require('../modules/clinical/clinical.routes');
const commissionersRoutes = require('../modules/commissioners/commissioners.routes');
const doctorsRoutes = require('../modules/doctors/doctors.routes');
const healthRoutes = require('../modules/health/health.routes');
const locationsRoutes = require('../modules/locations/locations.routes');
const notificationsRoutes = require('../modules/notifications/notifications.routes');
const paymentsRoutes = require('../modules/payments/payments.routes');
const profilesRoutes = require('../modules/profiles/profiles.routes');
const specialtiesRoutes = require('../modules/specialties/specialties.routes');
const usersRoutes = require('../modules/users/users.routes');
const videoConsultationRoutes = require('../modules/video-consultations/videoConsultation.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/locations', locationsRoutes);
router.use('/availability', availabilityRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/chat', chatRoutes);
router.use('/clinical', clinicalRoutes);
router.use('/commissioner', commissionersRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/profiles', profilesRoutes);
router.use('/doctors', doctorsRoutes);
router.use('/specialties', specialtiesRoutes);
router.use('/users', usersRoutes);
router.use('/video-consultations', videoConsultationRoutes);

module.exports = router;
