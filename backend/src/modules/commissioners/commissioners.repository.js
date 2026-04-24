const { query } = require('../../database/query');

async function findCommissionerProfileByUserId(userId) {
  const result = await query(
    `
      SELECT
        pc.id,
        pc.usuario_id AS "userId",
        pc.nombres AS "firstName",
        pc.apellidos AS "lastName",
        pc.codigo_referido_principal AS "primaryReferralCode",
        pc.porcentaje_comision_base AS "baseCommissionRate",
        pc.estado AS status
      FROM perfil_comisionista pc
      WHERE pc.usuario_id = $1
        AND pc.deleted_at IS NULL
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function getOverview(userId, commissionerProfileId) {
  const result = await query(
    `
      WITH linked_patients AS (
        SELECT DISTINCT c.paciente_id
        FROM cita c
        LEFT JOIN codigo_referido cr ON cr.id = c.codigo_referido_id AND cr.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
          AND (c.comisionista_id = $2 OR cr.usuario_id = $1)
      )
      SELECT
        (SELECT COUNT(*)::int FROM codigo_referido WHERE usuario_id = $1 AND deleted_at IS NULL AND esta_activo = TRUE) AS "activeCodes",
        (SELECT COUNT(*)::int FROM linked_patients) AS "linkedPatients",
        (
          SELECT COUNT(*)::int
          FROM cita c
          LEFT JOIN codigo_referido cr ON cr.id = c.codigo_referido_id AND cr.deleted_at IS NULL
          WHERE c.deleted_at IS NULL
            AND (c.comisionista_id = $2 OR cr.usuario_id = $1)
            AND c.estado IN ('pendiente_confirmacion', 'confirmada', 'en_curso')
        ) AS "activeAppointments",
        (
          SELECT COALESCE(SUM(c.monto_comision), 0)
          FROM comision c
          WHERE c.usuario_beneficiario_id = $1
            AND c.deleted_at IS NULL
        ) AS "totalCommissions",
        (
          SELECT COALESCE(SUM(c.monto_comision), 0)
          FROM comision c
          WHERE c.usuario_beneficiario_id = $1
            AND c.deleted_at IS NULL
            AND c.estado = 'liquidada'
        ) AS "liquidatedCommissions",
        (
          SELECT COALESCE(SUM(c.monto_comision), 0)
          FROM comision c
          WHERE c.usuario_beneficiario_id = $1
            AND c.deleted_at IS NULL
            AND c.estado IN ('calculada', 'pendiente_liquidacion')
        ) AS "pendingCommissions",
        (
          SELECT COALESCE(su.saldo_disponible, 0)
          FROM saldo_usuario su
          WHERE su.usuario_id = $1
            AND su.deleted_at IS NULL
          LIMIT 1
        ) AS "availableBalance"
    `,
    [userId, commissionerProfileId]
  );

  return result.rows[0] || null;
}

async function listRecentCommissions(userId, limit = 5) {
  const result = await query(
    `
      SELECT
        c.id,
        c.estado AS status,
        c.monto_comision AS amount,
        c.porcentaje_comision AS "commissionRate",
        c.fecha_calculo AS "calculatedAt",
        c.fecha_liquidacion AS "liquidatedAt",
        CONCAT(pp.nombres, ' ', pp.apellidos) AS patient,
        cita.fecha_hora_inicio_programada AS "appointmentAt",
        cr.codigo AS code
      FROM comision c
      INNER JOIN cita ON cita.id = c.cita_id
      INNER JOIN perfil_paciente pp ON pp.id = cita.paciente_id
      LEFT JOIN codigo_referido cr ON cr.id = c.codigo_referido_id
      WHERE c.usuario_beneficiario_id = $1
        AND c.deleted_at IS NULL
      ORDER BY COALESCE(c.fecha_calculo, c.created_at) DESC
      LIMIT $2
    `,
    [userId, limit]
  );

  return result.rows;
}

async function listReferralCodes(userId, { search, status }) {
  const values = [userId];
  const conditions = ['cr.usuario_id = $1', 'cr.deleted_at IS NULL'];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`cr.codigo ILIKE $${values.length}`);
  }

  if (status === 'active') {
    conditions.push('cr.esta_activo = TRUE');
  }

  if (status === 'inactive') {
    conditions.push('cr.esta_activo = FALSE');
  }

  const result = await query(
    `
      SELECT
        cr.id,
        cr.codigo AS code,
        cr.tipo_generador AS "generatorType",
        cr.esta_activo AS "isActive",
        cr.fecha_expiracion AS "expiresAt",
        COUNT(DISTINCT cita.paciente_id)::int AS "linkedPatients",
        COUNT(DISTINCT cita.id)::int AS "appointmentsCount",
        COALESCE(SUM(CASE WHEN com.deleted_at IS NULL THEN com.monto_comision ELSE 0 END), 0) AS "generatedCommission",
        COALESCE(SUM(CASE WHEN com.deleted_at IS NULL AND com.estado = 'liquidada' THEN com.monto_comision ELSE 0 END), 0) AS "liquidatedCommission"
      FROM codigo_referido cr
      LEFT JOIN cita ON cita.codigo_referido_id = cr.id AND cita.deleted_at IS NULL
      LEFT JOIN comision com ON com.codigo_referido_id = cr.id AND com.deleted_at IS NULL
      WHERE ${conditions.join(' AND ')}
      GROUP BY cr.id
      ORDER BY cr.created_at DESC
    `,
    values
  );

  return result.rows;
}

async function codeExists(code) {
  const result = await query(
    `
      SELECT 1
      FROM codigo_referido
      WHERE codigo = $1
      LIMIT 1
    `,
    [code]
  );

  return result.rowCount > 0;
}

async function createReferralCode({ userId, code, expiresAt }) {
  const result = await query(
    `
      INSERT INTO codigo_referido (usuario_id, codigo, tipo_generador, esta_activo, fecha_expiracion)
      VALUES ($1, $2, 'comisionista', TRUE, $3)
      RETURNING
        id,
        codigo AS code,
        tipo_generador AS "generatorType",
        esta_activo AS "isActive",
        fecha_expiracion AS "expiresAt"
    `,
    [userId, code, expiresAt]
  );

  return result.rows[0] || null;
}

async function listLinkedPatients(userId, commissionerProfileId, { search }) {
  const values = [userId, commissionerProfileId];
  const filters = [];

  if (search) {
    values.push(`%${search}%`);
    filters.push(`
      (
        CONCAT(pp.nombres, ' ', pp.apellidos) ILIKE $${values.length}
        OR u.correo_electronico ILIKE $${values.length}
        OR u.telefono ILIKE $${values.length}
      )
    `);
  }

  const result = await query(
    `
      WITH linked_patients AS (
        SELECT DISTINCT c.paciente_id
        FROM cita c
        LEFT JOIN codigo_referido cr ON cr.id = c.codigo_referido_id AND cr.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
          AND (c.comisionista_id = $2 OR cr.usuario_id = $1)
      )
      SELECT
        pp.id AS "patientId",
        pp.usuario_id AS "userId",
        CONCAT(pp.nombres, ' ', pp.apellidos) AS patient,
        u.correo_electronico AS email,
        u.telefono AS phone,
        pp.autorizo_participacion_comisionista_chat AS "authorizesCommissionAgentChat",
        next_appointment.id AS "nextAppointmentId",
        next_appointment.fecha_hora_inicio_programada AS "nextAppointmentAt",
        next_appointment.estado AS "nextAppointmentStatus",
        CONCAT(next_doctor.nombres, ' ', next_doctor.apellidos) AS "nextDoctor",
        COALESCE(completed.total_completed, 0)::int AS "completedAppointments",
        COALESCE(records.total_records, 0)::int AS "medicalRecordsCount",
        latest_note.analisis AS "latestAssessment",
        latest_note.plan AS "latestPlan"
      FROM linked_patients lp
      INNER JOIN perfil_paciente pp ON pp.id = lp.paciente_id AND pp.deleted_at IS NULL
      INNER JOIN usuario u ON u.id = pp.usuario_id AND u.deleted_at IS NULL
      LEFT JOIN LATERAL (
        SELECT c.id, c.fecha_hora_inicio_programada, c.estado, c.medico_id
        FROM cita c
        WHERE c.paciente_id = pp.id
          AND c.deleted_at IS NULL
          AND c.estado IN ('pendiente_confirmacion', 'confirmada', 'en_curso')
        ORDER BY c.fecha_hora_inicio_programada ASC
        LIMIT 1
      ) next_appointment ON TRUE
      LEFT JOIN perfil_medico next_doctor ON next_doctor.id = next_appointment.medico_id
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS total_completed
        FROM cita c
        WHERE c.paciente_id = pp.id
          AND c.deleted_at IS NULL
          AND c.estado = 'completada'
      ) completed ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS total_records
        FROM historia_clinica hc
        WHERE hc.paciente_id = pp.id
          AND hc.deleted_at IS NULL
      ) records ON TRUE
      LEFT JOIN LATERAL (
        SELECT nc.analisis, nc.plan
        FROM nota_clinica nc
        INNER JOIN cita c ON c.id = nc.cita_id
        WHERE c.paciente_id = pp.id
          AND nc.deleted_at IS NULL
          AND c.deleted_at IS NULL
        ORDER BY nc.created_at DESC
        LIMIT 1
      ) latest_note ON TRUE
      ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
      ORDER BY patient ASC
    `,
    values
  );

  return result.rows;
}

module.exports = {
  codeExists,
  createReferralCode,
  findCommissionerProfileByUserId,
  getOverview,
  listLinkedPatients,
  listRecentCommissions,
  listReferralCodes
};
