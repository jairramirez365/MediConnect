const availabilityService = require('./availability.service');

async function createMyAvailability(req, res) {
  const availability = await availabilityService.createMyAvailability(req.body, req.user);

  res.status(201).json({
    message: 'Availability created successfully',
    data: availability
  });
}

async function listMyAvailability(req, res) {
  const availability = await availabilityService.listMyAvailability(req.user);

  res.status(200).json({
    data: availability
  });
}

async function updateMyAvailability(req, res) {
  const availability = await availabilityService.updateMyAvailability(req.params.id, req.body, req.user);

  res.status(200).json({
    message: 'Availability updated successfully',
    data: availability
  });
}

async function deleteMyAvailability(req, res) {
  const deleted = await availabilityService.deleteMyAvailability(req.params.id, req.user);

  res.status(200).json({
    message: 'Availability deleted successfully',
    data: deleted
  });
}

async function getDoctorAvailability(req, res) {
  const result = await availabilityService.getDoctorAvailability(req.params.doctorId, req.query);

  res.status(200).json({
    data: result
  });
}

module.exports = {
  createMyAvailability,
  deleteMyAvailability,
  getDoctorAvailability,
  listMyAvailability,
  updateMyAvailability
};
