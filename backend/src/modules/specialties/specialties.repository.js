const { query } = require('../../database/query');

async function listSpecialties() {
  const result = await query(
    `
      SELECT id, nombre AS name, descripcion AS description, estado AS status
      FROM especialidad
      WHERE deleted_at IS NULL
      ORDER BY nombre ASC
    `
  );

  return result.rows;
}

async function createSpecialty(payload) {
  const result = await query(
    `
      INSERT INTO especialidad (nombre, descripcion, estado)
      VALUES ($1, $2, 'activa')
      RETURNING id, nombre AS name, descripcion AS description, estado AS status
    `,
    [payload.name, payload.description || null]
  );

  return result.rows[0];
}

async function updateSpecialty(id, payload) {
  const result = await query(
    `
      UPDATE especialidad
      SET
        nombre = COALESCE($2, nombre),
        descripcion = COALESCE($3, descripcion),
        estado = COALESCE($4, estado)
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING id, nombre AS name, descripcion AS description, estado AS status
    `,
    [id, payload.name || null, payload.description || null, payload.status || null]
  );

  return result.rows[0] || null;
}

async function deleteSpecialty(id) {
  const result = await query(
    `
      UPDATE especialidad
      SET deleted_at = NOW(), estado = 'inactiva'
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING id
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function findDoctorProfileByUserId(userId) {
  const result = await query(
    `
      SELECT id
      FROM perfil_medico
      WHERE usuario_id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function findActiveSpecialtiesByIds(ids) {
  const result = await query(
    `
      SELECT id, nombre AS name
      FROM especialidad
      WHERE id = ANY($1::uuid[])
        AND estado = 'activa'
        AND deleted_at IS NULL
    `,
    [ids]
  );

  return result.rows;
}

async function countActiveSpecialtiesForDoctor(doctorId) {
  const result = await query(
    `
      SELECT COUNT(*)::int AS total
      FROM medico_especialidad
      WHERE medico_id = $1
        AND deleted_at IS NULL
    `,
    [doctorId]
  );

  return result.rows[0]?.total || 0;
}

async function doctorAlreadyHasSpecialty(doctorId, specialtyId) {
  const result = await query(
    `
      SELECT id
      FROM medico_especialidad
      WHERE medico_id = $1
        AND especialidad_id = $2
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [doctorId, specialtyId]
  );

  return Boolean(result.rows[0]);
}

async function assignSpecialtyToDoctor(doctorId, specialtyId, isPrimary) {
  const result = await query(
    `
      INSERT INTO medico_especialidad (medico_id, especialidad_id, es_principal)
      VALUES ($1, $2, $3)
      ON CONFLICT (medico_id, especialidad_id)
      DO UPDATE SET es_principal = EXCLUDED.es_principal, deleted_at = NULL
      RETURNING id, medico_id AS "doctorId", especialidad_id AS "specialtyId", es_principal AS "isPrimary"
    `,
    [doctorId, specialtyId, Boolean(isPrimary)]
  );

  return result.rows[0];
}

async function removeSpecialtyFromDoctor(doctorId, specialtyId) {
  const result = await query(
    `
      UPDATE medico_especialidad
      SET deleted_at = NOW()
      WHERE medico_id = $1
        AND especialidad_id = $2
        AND deleted_at IS NULL
      RETURNING id
    `,
    [doctorId, specialtyId]
  );

  return result.rows[0] || null;
}

module.exports = {
  assignSpecialtyToDoctor,
  countActiveSpecialtiesForDoctor,
  createSpecialty,
  deleteSpecialty,
  doctorAlreadyHasSpecialty,
  findActiveSpecialtiesByIds,
  findDoctorProfileByUserId,
  listSpecialties,
  removeSpecialtyFromDoctor,
  updateSpecialty
};
