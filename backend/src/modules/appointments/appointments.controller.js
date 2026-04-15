const appointmentsService = require('./appointments.service');

async function createAppointment(req, res) {
  const appointment = await appointmentsService.createAppointment(req.body, req.user);

  res.status(201).json({
    message: 'Appointment created successfully',
    data: appointment
  });
}

async function listAppointments(req, res) {
  const result = await appointmentsService.listAppointments({
    status: req.query.status,
    doctorId: req.query.doctorId,
    patientId: req.query.patientId,
    page: req.query.page,
    limit: req.query.limit
  }, req.user);

  res.status(200).json(result);
}

async function updateAppointmentStatus(req, res) {
  const appointment = await appointmentsService.updateAppointmentStatus(req.params.id, req.body);

  res.status(200).json({
    message: 'Appointment updated successfully',
    data: appointment
  });
}

async function confirmAppointment(req, res) {
  const appointment = await appointmentsService.confirmAppointment(req.params.id, req.user);

  res.status(200).json({
    message: 'Appointment confirmed successfully',
    data: appointment
  });
}

async function cancelAppointment(req, res) {
  const appointment = await appointmentsService.cancelAppointment(req.params.id, req.body, req.user);

  res.status(200).json({
    message: 'Appointment cancelled successfully',
    data: appointment
  });
}

async function rescheduleAppointment(req, res) {
  const appointment = await appointmentsService.rescheduleAppointment(req.params.id, req.body, req.user);

  res.status(200).json({
    message: 'Appointment rescheduled successfully',
    data: appointment
  });
}

async function completeAppointment(req, res) {
  const appointment = await appointmentsService.completeAppointment(req.params.id, req.user);

  res.status(200).json({
    message: 'Appointment completed successfully',
    data: appointment
  });
}

module.exports = {
  cancelAppointment,
  completeAppointment,
  confirmAppointment,
  createAppointment,
  listAppointments,
  rescheduleAppointment,
  updateAppointmentStatus
};
