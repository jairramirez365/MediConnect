const locationsService = require('./locations.service');

async function listDepartments(req, res) {
  const departments = await locationsService.listDepartments();
  res.status(200).json({ data: departments });
}

async function listMunicipalities(req, res) {
  const municipalities = await locationsService.listMunicipalities(req.query.departmentCode);
  res.status(200).json({ data: municipalities });
}

module.exports = {
  listDepartments,
  listMunicipalities
};
