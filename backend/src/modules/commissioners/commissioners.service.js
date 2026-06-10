const AppError = require('../../utils/AppError');
const { writeAudit } = require('../../utils/audit');
const commissionersRepository = require('./commissioners.repository');

async function ensureCommissioner(user) {
  const profile = await commissionersRepository.findCommissionerProfileByUserId(user.sub);

  if (!profile) {
    throw new AppError('Gestor profile not found', 404);
  }

  return profile;
}

async function getOverview(user) {
  const profile = await ensureCommissioner(user);
  const [overview, recentCommissions] = await Promise.all([
    commissionersRepository.getOverview(user.sub, profile.id),
    commissionersRepository.listRecentCommissions(user.sub)
  ]);

  return {
    profile,
    overview,
    recentCommissions
  };
}

async function listCodes(query, user) {
  await ensureCommissioner(user);
  return commissionersRepository.listReferralCodes(user.sub, {
    search: query.search,
    status: query.status
  });
}

function buildCandidateCode() {
  return `C-${Math.floor(100000 + Math.random() * 900000)}`;
}

async function createCode(user) {
  await ensureCommissioner(user);

  let code = null;
  for (let attempts = 0; attempts < 15; attempts += 1) {
    const candidate = buildCandidateCode();
    // eslint-disable-next-line no-await-in-loop
    const exists = await commissionersRepository.codeExists(candidate);
    if (!exists) {
      code = candidate;
      break;
    }
  }

  if (!code) {
    throw new AppError('Could not generate a unique referral code', 500);
  }

  const createdCode = await commissionersRepository.createReferralCode({
    userId: user.sub,
    code,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  });

  await writeAudit({
    actorUserId: user.sub,
    entity: 'codigo_referido',
    entityId: createdCode.id,
    action: 'crear_codigo_referido',
    newValues: { code: createdCode.code }
  });

  return createdCode;
}

async function listPatients(query, user) {
  const profile = await ensureCommissioner(user);
  return commissionersRepository.listLinkedPatients(user.sub, profile.id, {
    search: query.search
  });
}

module.exports = {
  createCode,
  getOverview,
  listCodes,
  listPatients
};
