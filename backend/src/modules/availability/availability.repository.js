const { query } = require('../../database/query');

async function findDoctorProfileByUserId(userId) {
  const result = await query(
    `
      SELECT id, estado_validacion AS "validationStatus"
      FROM perfil_medico
      WHERE usuario_id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function createAvailability(payload) {
  const result = await query(
    `
      INSERT INTO disponibilidad_medico (
        medico_id,
        dia_semana,
        hora_inicio,
        hora_fin,
        duracion_bloque_minutos,
        zona_horaria,
        esta_activa,
        vigente_desde,
        vigente_hasta
      )
      VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, $8)
      RETURNING
        id,
        medico_id AS "doctorId",
        dia_semana AS "dayOfWeek",
        hora_inicio AS "startTime",
        hora_fin AS "endTime",
        duracion_bloque_minutos AS "slotDurationMinutes",
        zona_horaria AS "timeZone",
        esta_activa AS "isActive",
        vigente_desde AS "validFrom",
        vigente_hasta AS "validTo"
    `,
    [
      payload.doctorId,
      payload.dayOfWeek,
      payload.startTime,
      payload.endTime,
      payload.slotDurationMinutes,
      payload.timeZone,
      payload.validFrom,
      payload.validTo || null
    ]
  );

  return result.rows[0];
}

async function listDoctorAvailability(doctorId) {
  const result = await query(
    `
      SELECT
        id,
        medico_id AS "doctorId",
        dia_semana AS "dayOfWeek",
        hora_inicio AS "startTime",
        hora_fin AS "endTime",
        duracion_bloque_minutos AS "slotDurationMinutes",
        zona_horaria AS "timeZone",
        esta_activa AS "isActive",
        vigente_desde AS "validFrom",
        vigente_hasta AS "validTo"
      FROM disponibilidad_medico
      WHERE medico_id = $1
        AND deleted_at IS NULL
      ORDER BY dia_semana ASC, hora_inicio ASC
    `,
    [doctorId]
  );

  return result.rows;
}

async function updateAvailability(availabilityId, doctorId, payload) {
  const result = await query(
    `
      UPDATE disponibilidad_medico
      SET
        dia_semana = COALESCE($3, dia_semana),
        hora_inicio = COALESCE($4, hora_inicio),
        hora_fin = COALESCE($5, hora_fin),
        duracion_bloque_minutos = COALESCE($6, duracion_bloque_minutos),
        zona_horaria = COALESCE($7, zona_horaria),
        esta_activa = COALESCE($8, esta_activa),
        vigente_desde = COALESCE($9, vigente_desde),
        vigente_hasta = COALESCE($10, vigente_hasta)
      WHERE id = $1
        AND medico_id = $2
        AND deleted_at IS NULL
      RETURNING
        id,
        medico_id AS "doctorId",
        dia_semana AS "dayOfWeek",
        hora_inicio AS "startTime",
        hora_fin AS "endTime",
        duracion_bloque_minutos AS "slotDurationMinutes",
        zona_horaria AS "timeZone",
        esta_activa AS "isActive",
        vigente_desde AS "validFrom",
        vigente_hasta AS "validTo"
    `,
    [
      availabilityId,
      doctorId,
      payload.dayOfWeek ?? null,
      payload.startTime || null,
      payload.endTime || null,
      payload.slotDurationMinutes ?? null,
      payload.timeZone || null,
      payload.isActive ?? null,
      payload.validFrom || null,
      payload.validTo || null
    ]
  );

  return result.rows[0] || null;
}

async function deleteAvailability(availabilityId, doctorId) {
  const result = await query(
    `
      UPDATE disponibilidad_medico
      SET deleted_at = NOW(), esta_activa = FALSE
      WHERE id = $1
        AND medico_id = $2
        AND deleted_at IS NULL
      RETURNING id
    `,
    [availabilityId, doctorId]
  );

  return result.rows[0] || null;
}

async function listAppointmentsForDoctor(doctorId, dateFrom, dateTo) {
  const result = await query(
    `
      SELECT
        id,
        fecha_hora_inicio_programada AS "scheduledStartAt",
        fecha_hora_fin_programada AS "scheduledEndAt"
      FROM cita
      WHERE medico_id = $1
        AND (
          estado IN ('pendiente_confirmacion', 'confirmada', 'en_curso')
          OR (estado = 'pendiente_pago' AND fecha_expiracion_pago > NOW())
        )
        AND deleted_at IS NULL
        AND fecha_hora_inicio_programada >= $2::timestamptz
        AND fecha_hora_inicio_programada < $3::timestamptz
    `,
    [doctorId, dateFrom, dateTo]
  );

  return result.rows;
}

module.exports = {
  createAvailability,
  deleteAvailability,
  findDoctorProfileByUserId,
  listAppointmentsForDoctor,
  listDoctorAvailability,
  updateAvailability
};
