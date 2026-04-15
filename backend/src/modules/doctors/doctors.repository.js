const { query, withTransaction } = require('../../database/query');

async function searchDoctors(filters) {
  const values = [];
  const conditions = ['pm.deleted_at IS NULL', 'pm.estado_validacion = $1'];
  values.push('activo');

  if (filters.city) {
    values.push(`%${filters.city}%`);
    conditions.push(`pm.ciudad ILIKE $${values.length}`);
  }

  if (filters.specialty) {
    values.push(`%${filters.specialty}%`);
    conditions.push(`e.nombre ILIKE $${values.length}`);
  }

  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  values.push(limit);
  const limitParam = values.length;
  values.push(offset);
  const offsetParam = values.length;

  const sql = `
    SELECT
      pm.id,
      pm.nombres,
      pm.apellidos,
      pm.ciudad,
      pm.modalidad_atencion AS "careMode",
      pm.valor_consulta AS "consultationFee",
      pm.promedio_calificacion AS "ratingAverage",
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT e.nombre), NULL) AS specialties,
      COUNT(*) OVER()::int AS total
    FROM perfil_medico pm
    LEFT JOIN medico_especialidad me ON me.medico_id = pm.id AND me.deleted_at IS NULL
    LEFT JOIN especialidad e ON e.id = me.especialidad_id AND e.deleted_at IS NULL
    WHERE ${conditions.join(' AND ')}
    GROUP BY pm.id
    ORDER BY pm.promedio_calificacion DESC, pm.apellidos ASC
    LIMIT $${limitParam}
    OFFSET $${offsetParam}
  `;

  const result = await query(sql, values);
  return {
    rows: result.rows.map(({ total, ...row }) => row),
    total: result.rows[0]?.total || 0
  };
}

async function findDoctorProfileByUserId(userId) {
  const result = await query(
    `
      SELECT id, usuario_id AS "userId", estado_validacion AS "validationStatus"
      FROM perfil_medico
      WHERE usuario_id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function findAdminProfileByUserId(userId) {
  const result = await query(
    `
      SELECT id, usuario_id AS "userId"
      FROM perfil_administrador
      WHERE usuario_id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function createMedicalDocument(payload) {
  return withTransaction(async (client) => {
    const documentResult = await client.query(
      `
        INSERT INTO documento_medico (
          medico_id,
          tipo_documento,
          nombre_archivo,
          url_archivo,
          estado_revision
        )
        VALUES ($1, $2, $3, $4, 'en_revision')
        RETURNING
          id,
          medico_id AS "doctorId",
          tipo_documento AS "documentType",
          nombre_archivo AS "fileName",
          url_archivo AS "fileUrl",
          estado_revision AS "reviewStatus",
          fecha_carga AS "uploadedAt"
      `,
      [
        payload.doctorId,
        payload.documentType,
        payload.fileName,
        payload.fileUrl
      ]
    );

    const doctorResult = await client.query(
      `
        UPDATE perfil_medico
        SET estado_validacion = 'documentacion_en_revision'
        WHERE id = $1
          AND estado_validacion IN ('registro_basico', 'pendiente_documentacion')
          AND deleted_at IS NULL
        RETURNING id, estado_validacion AS "validationStatus"
      `,
      [payload.doctorId]
    );

    return {
      document: documentResult.rows[0],
      doctor: doctorResult.rows[0] || {
        id: payload.doctorId,
        validationStatus: 'documentacion_en_revision'
      }
    };
  });
}

async function listDoctorsPendingReview() {
  const result = await query(
    `
      SELECT
        pm.id,
        pm.nombres AS "firstName",
        pm.apellidos AS "lastName",
        pm.numero_registro_medico AS "medicalLicenseNumber",
        pm.ciudad AS city,
        pm.estado_validacion AS "validationStatus",
        COUNT(dm.id)::int AS "documentsCount"
      FROM perfil_medico pm
      LEFT JOIN documento_medico dm ON dm.medico_id = pm.id AND dm.deleted_at IS NULL
      WHERE pm.estado_validacion = 'documentacion_en_revision'
        AND pm.deleted_at IS NULL
      GROUP BY pm.id
      ORDER BY pm.created_at ASC
    `
  );

  return result.rows;
}

async function reviewMedicalDocument(payload) {
  const result = await query(
    `
      UPDATE documento_medico
      SET
        estado_revision = $3,
        observacion_revision = $4,
        administrador_revisor_id = $5,
        fecha_revision = NOW()
      WHERE id = $1
        AND medico_id = $2
        AND deleted_at IS NULL
      RETURNING
        id,
        medico_id AS "doctorId",
        estado_revision AS "reviewStatus",
        observacion_revision AS "reviewObservation",
        administrador_revisor_id AS "reviewedByAdminId",
        fecha_revision AS "reviewedAt"
    `,
    [
      payload.documentId,
      payload.doctorId,
      payload.reviewStatus,
      payload.reviewObservation || null,
      payload.adminProfileId
    ]
  );

  return result.rows[0] || null;
}

async function getDocumentReviewSummary(doctorId) {
  const result = await query(
    `
      SELECT
        COUNT(*) FILTER (WHERE estado_revision = 'aprobado')::int AS "approvedDocuments",
        COUNT(*) FILTER (WHERE estado_revision = 'rechazado')::int AS "rejectedDocuments",
        COUNT(*)::int AS "totalDocuments"
      FROM documento_medico
      WHERE medico_id = $1
        AND deleted_at IS NULL
    `,
    [doctorId]
  );

  return result.rows[0];
}

async function approveDoctor(doctorId, adminProfileId) {
  return withTransaction(async (client) => {
    const result = await client.query(
      `
        UPDATE perfil_medico
        SET
          estado_validacion = 'activo',
          fue_aprobado_por_administrador = TRUE,
          administrador_aprobador_id = $2,
          fecha_aprobacion = NOW()
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING id, usuario_id AS "userId", estado_validacion AS "validationStatus"
      `,
      [doctorId, adminProfileId]
    );

    const doctor = result.rows[0] || null;

    if (!doctor) {
      return null;
    }

    await client.query(
      `
        UPDATE usuario
        SET estado = 'activo'
        WHERE id = $1
      `,
      [doctor.userId]
    );

    return doctor;
  });
}

async function rejectDoctor(doctorId, adminProfileId, reason) {
  return withTransaction(async (client) => {
    const result = await client.query(
      `
        UPDATE perfil_medico
        SET
          estado_validacion = 'rechazado',
          fue_aprobado_por_administrador = FALSE,
          administrador_aprobador_id = $2,
          fecha_aprobacion = NOW()
        WHERE id = $1
          AND deleted_at IS NULL
        RETURNING id, usuario_id AS "userId", estado_validacion AS "validationStatus"
      `,
      [doctorId, adminProfileId]
    );

    const doctor = result.rows[0] || null;

    if (!doctor) {
      return null;
    }

    await client.query(
      `
        UPDATE usuario
        SET estado = 'inactivo'
        WHERE id = $1
      `,
      [doctor.userId]
    );

    await client.query(
      `
        INSERT INTO auditoria (
          usuario_actor_id,
          entidad,
          entidad_id,
          accion,
          valores_nuevos
        )
        VALUES (
          (SELECT usuario_id FROM perfil_administrador WHERE id = $1),
          'perfil_medico',
          $2,
          'rechazar_medico',
          jsonb_build_object('reason', $3)
        )
      `,
      [adminProfileId, doctorId, reason || null]
    );

    return doctor;
  });
}

module.exports = {
  approveDoctor,
  createMedicalDocument,
  findAdminProfileByUserId,
  findDoctorProfileByUserId,
  getDocumentReviewSummary,
  listDoctorsPendingReview,
  rejectDoctor,
  reviewMedicalDocument,
  searchDoctors
};
