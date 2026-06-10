const videoConsultationService = require('./videoConsultation.service');

async function prepareVideoSession(req, res) {
  const data = await videoConsultationService.prepareVideoSession(req.params.appointmentId, req.user);
  res.status(201).json({
    message: 'Video consultation prepared successfully',
    data
  });
}

async function getVideoSession(req, res) {
  const data = await videoConsultationService.getVideoSessionByAppointment(req.params.appointmentId, req.user);
  res.status(200).json({ data });
}

async function startVideoSession(req, res) {
  const data = await videoConsultationService.startVideoSession(req.params.id, req.user);
  res.status(200).json({
    message: 'Video consultation started successfully',
    data
  });
}

async function endVideoSession(req, res) {
  const data = await videoConsultationService.endVideoSession(req.params.id, req.user);
  res.status(200).json({
    message: 'Video consultation ended successfully',
    data
  });
}

async function listVideoMessages(req, res) {
  const data = await videoConsultationService.listVideoMessages(req.params.id, req.user);
  res.status(200).json({ data });
}

async function sendVideoMessage(req, res) {
  const data = await videoConsultationService.sendVideoMessage(req.params.id, req.body, req.user);
  res.status(201).json({
    message: 'Video consultation message sent successfully',
    data
  });
}

async function listVideoConsultations(req, res) {
  const result = await videoConsultationService.listVideoConsultations(req.query, req.user);
  res.status(200).json(result);
}

module.exports = {
  endVideoSession,
  getVideoSession,
  listVideoConsultations,
  listVideoMessages,
  prepareVideoSession,
  sendVideoMessage,
  startVideoSession
};
