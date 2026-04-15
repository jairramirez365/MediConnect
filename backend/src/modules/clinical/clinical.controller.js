const clinicalService = require('./clinical.service');

async function listMyMedicalRecords(req, res) {
  const records = await clinicalService.listMyMedicalRecords(req.user);
  res.status(200).json({ data: records });
}

async function listPatientMedicalRecords(req, res) {
  const records = await clinicalService.listPatientMedicalRecords(req.params.patientId, req.user);
  res.status(200).json({ data: records });
}

async function createClinicalNote(req, res) {
  const note = await clinicalService.createClinicalNote(req.params.appointmentId, req.body, req.user);
  res.status(201).json({ message: 'Clinical note created successfully', data: note });
}

async function createPrescription(req, res) {
  const prescription = await clinicalService.createPrescription(req.params.appointmentId, req.body, req.user);
  res.status(201).json({ message: 'Prescription created successfully', data: prescription });
}

async function listMyPrescriptions(req, res) {
  const prescriptions = await clinicalService.listMyPrescriptions(req.user);
  res.status(200).json({ data: prescriptions });
}

module.exports = {
  createClinicalNote,
  createPrescription,
  listMyMedicalRecords,
  listMyPrescriptions,
  listPatientMedicalRecords
};
