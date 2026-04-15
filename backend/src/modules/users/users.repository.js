const { query } = require('../../database/query');

async function listUsers({ limit, offset, role, status }) {
  const values = [];
  const conditions = ['deleted_at IS NULL'];

  if (role) {
    values.push(role);
    conditions.push(`rol_codigo = $${values.length}`);
  }

  if (status) {
    values.push(status);
    conditions.push(`estado = $${values.length}`);
  }

  values.push(limit);
  const limitParam = values.length;
  values.push(offset);
  const offsetParam = values.length;

  const result = await query(
    `
      SELECT
        id,
        correo_electronico AS email,
        telefono AS phone,
        rol_codigo AS role,
        estado AS status,
        created_at AS "createdAt",
        COUNT(*) OVER()::int AS total
      FROM usuario
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${limitParam}
      OFFSET $${offsetParam}
    `,
    values
  );

  return {
    rows: result.rows.map(({ total, ...row }) => row),
    total: result.rows[0]?.total || 0
  };
}

async function updateUserStatus(userId, status) {
  const result = await query(
    `
      UPDATE usuario
      SET estado = $2
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING id, correo_electronico AS email, rol_codigo AS role, estado AS status
    `,
    [userId, status]
  );

  return result.rows[0] || null;
}

module.exports = {
  listUsers,
  updateUserStatus
};
