const profilesService = require('./profiles.service');

async function getMyProfile(req, res) {
  const profile = await profilesService.getMyProfile(req.user);
  res.status(200).json({ data: profile });
}

async function updateMyProfile(req, res) {
  const profile = await profilesService.updateMyProfile(req.body, req.user);
  res.status(200).json({ message: 'Profile updated successfully', data: profile });
}

module.exports = {
  getMyProfile,
  updateMyProfile
};
