const AppError = require('../../utils/AppError');
const { writeAudit } = require('../../utils/audit');
const { buildPagination, getPagination } = require('../../utils/pagination');
const { isUuid } = require('../../utils/validators');
const usersRepository = require('./users.repository');

async function listUsers(query) {
  const pagination = getPagination(query);
  const result = await usersRepository.listUsers({
    ...pagination,
    role: query.role,
    status: query.status,
    search: query.search
  });

  return {
    data: result.rows,
    pagination: buildPagination({ ...pagination, total: result.total })
  };
}

async function setUserStatus(userId, status, actor) {
  if (!isUuid(userId)) throw new AppError('Invalid userId', 400);

  const user = await usersRepository.updateUserStatus(userId, status);
  if (!user) throw new AppError('User not found', 404);

  await writeAudit({
    actorUserId: actor.sub,
    entity: 'usuario',
    entityId: user.id,
    action: 'actualizar_estado_usuario',
    newValues: { status }
  });

  return user;
}

module.exports = {
  listUsers,
  setUserStatus
};
