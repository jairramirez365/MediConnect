const commissionersService = require('./commissioners.service');

async function getOverview(req, res) {
  const data = await commissionersService.getOverview(req.user);
  res.status(200).json({ data });
}

async function listCodes(req, res) {
  const data = await commissionersService.listCodes(req.query, req.user);
  res.status(200).json({ data });
}

async function createCode(req, res) {
  const data = await commissionersService.createCode(req.user);
  res.status(201).json({ message: 'Referral code created successfully', data });
}

async function listPatients(req, res) {
  const data = await commissionersService.listPatients(req.query, req.user);
  res.status(200).json({ data });
}

module.exports = {
  createCode,
  getOverview,
  listCodes,
  listPatients
};
