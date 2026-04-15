const specialtiesService = require('./specialties.service');

async function listSpecialties(req, res) {
  const specialties = await specialtiesService.listSpecialties();
  res.status(200).json({ data: specialties });
}

async function createSpecialty(req, res) {
  const specialty = await specialtiesService.createSpecialty(req.body);
  res.status(201).json({ message: 'Specialty created successfully', data: specialty });
}

async function updateSpecialty(req, res) {
  const specialty = await specialtiesService.updateSpecialty(req.params.id, req.body);
  res.status(200).json({ message: 'Specialty updated successfully', data: specialty });
}

async function deleteSpecialty(req, res) {
  const deleted = await specialtiesService.deleteSpecialty(req.params.id);
  res.status(200).json({ message: 'Specialty deleted successfully', data: deleted });
}

async function assignMySpecialty(req, res) {
  const assignment = await specialtiesService.assignMySpecialty(req.body, req.user);
  res.status(201).json({ message: 'Specialty assigned successfully', data: assignment });
}

async function assignSpecialtyToDoctor(req, res) {
  const assignment = await specialtiesService.assignSpecialtyToDoctor(req.params.doctorId, req.body);
  res.status(201).json({ message: 'Specialty assigned successfully', data: assignment });
}

async function removeSpecialtyFromDoctor(req, res) {
  const deleted = await specialtiesService.removeSpecialtyFromDoctor(req.params.doctorId, req.params.specialtyId);
  res.status(200).json({ message: 'Specialty removed successfully', data: deleted });
}

module.exports = {
  assignMySpecialty,
  assignSpecialtyToDoctor,
  createSpecialty,
  deleteSpecialty,
  listSpecialties,
  removeSpecialtyFromDoctor,
  updateSpecialty
};
