const { query } = require('../database/query');

async function writeAudit({ actorUserId, entity, entityId, action, oldValues = null, newValues = null }) {
  await query(
    `
      INSERT INTO auditoria (
        usuario_actor_id,
        entidad,
        entidad_id,
        accion,
        valores_anteriores,
        valores_nuevos
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      actorUserId || null,
      entity,
      entityId || null,
      action,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null
    ]
  );
}

module.exports = {
  writeAudit
};
