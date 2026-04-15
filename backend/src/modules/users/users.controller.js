const usersService = require('./users.service');

async function listUsers(req, res) {
  const result = await usersService.listUsers(req.query);
  res.status(200).json(result);
}

async function blockUser(req, res) {
  const user = await usersService.setUserStatus(req.params.id, 'bloqueado', req.user);
  res.status(200).json({ message: 'User blocked successfully', data: user });
}

async function unblockUser(req, res) {
  const user = await usersService.setUserStatus(req.params.id, 'activo', req.user);
  res.status(200).json({ message: 'User unblocked successfully', data: user });
}

module.exports = {
  blockUser,
  listUsers,
  unblockUser
};
