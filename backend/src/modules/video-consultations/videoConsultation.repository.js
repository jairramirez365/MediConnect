const { query, withTransaction } = require('../../database/query');

let schemaReadyPromise = null;

async function ensureVideoConsultationSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS video_consulta (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          cita_id UUID NOT NULL UNIQUE REFERENCES cita(id),
          proveedor VARCHAR(40) NOT NULL,
          proveedor_sala_id VARCHAR(120),
          url_sala TEXT,
          estado VARCHAR(30) NOT NULL DEFAULT 'pending',
          fecha_habilitacion_acceso TIMESTAMPTZ,
          fecha_expiracion_acceso TIMESTAMPTZ,
          fecha_inicio_real TIMESTAMPTZ,
          fecha_fin_real TIMESTAMPTZ,
          url_grabacion TEXT,
          metadata JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          deleted_at TIMESTAMPTZ,
          CONSTRAINT chk_video_consulta_estado
            CHECK (estado IN ('pending', 'ready', 'in_progress', 'completed', 'cancelled', 'expired', 'failed'))
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS mensaje_video_consulta (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          video_consulta_id UUID NOT NULL REFERENCES video_consulta(id),
          remitente_usuario_id UUID NOT NULL REFERENCES usuario(id),
          rol_remitente VARCHAR(30) NOT NULL,
          tipo_mensaje VARCHAR(20) NOT NULL DEFAULT 'texto',
          contenido TEXT NOT NULL,
          metadata JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          deleted_at TIMESTAMPTZ,
          CONSTRAINT chk_mensaje_video_consulta_tipo
            CHECK (tipo_mensaje IN ('texto', 'sistema', 'archivo'))
        )
      `);

      await query(`CREATE INDEX IF NOT EXISTS idx_video_consulta_cita_id ON video_consulta(cita_id)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_video_consulta_estado ON video_consulta(estado)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_video_consulta_proveedor ON video_consulta(proveedor)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_mensaje_video_consulta_video_id ON mensaje_video_consulta(video_consulta_id)`);
      await query(`CREATE INDEX IF NOT EXISTS idx_mensaje_video_consulta_created_at ON mensaje_video_consulta(created_at)`);
    })().catch((error) => {
      schemaReadyPromise = null;
      throw error;
    });
  }

  return schemaReadyPromise;
}

async function findAppointmentContext(appointmentId) {
  const result = await query(
    `
      SELECT
        c.id,
        c.estado AS status,
        c.canal_atencion AS "careChannel",
        c.fecha_hora_inicio_programada AS "scheduledStartAt",
        c.fecha_hora_fin_programada AS "scheduledEndAt",
        c.zona_horaria AS "timeZone",
        c.motivo_consulta AS reason,
        c.tipo_consulta AS "appointmentType",
        c.requiere_comisionista_en_chat AS "requiresCommissionAgentInChat",
        c.paciente_id AS "patientId",
        pp.usuario_id AS "patientUserId",
        CONCAT(pp.nombres, ' ', pp.apellidos) AS patient,
        c.medico_id AS "doctorId",
        pm.usuario_id AS "doctorUserId",
        CONCAT(pm.nombres, ' ', pm.apellidos) AS doctor,
        c.comisionista_id AS "commissionAgentId",
        pc.usuario_id AS "commissionAgentUserId",
        specialties.specialties AS "doctorSpecialties",
        chat_request.status AS "commissionAgentChatRequestStatus"
      FROM cita c
      INNER JOIN perfil_paciente pp ON pp.id = c.paciente_id
      INNER JOIN perfil_medico pm ON pm.id = c.medico_id
      LEFT JOIN perfil_comisionista pc ON pc.id = c.comisionista_id
      LEFT JOIN LATERAL (
        SELECT ARRAY_REMOVE(ARRAY_AGG(DISTINCT e.nombre), NULL) AS specialties
        FROM medico_especialidad me
        INNER JOIN especialidad e ON e.id = me.especialidad_id AND e.deleted_at IS NULL
        WHERE me.medico_id = c.medico_id
          AND me.deleted_at IS NULL
      ) specialties ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          CASE
            WHEN n.tipo_notificacion = 'solicitud_participacion_comisionista_chat_aceptada' THEN 'aceptada'
            WHEN n.tipo_notificacion = 'solicitud_participacion_comisionista_chat_rechazada' THEN 'rechazada'
            ELSE 'pendiente_paciente'
          END AS status
        FROM notificacion n
        WHERE n.cita_id = c.id
          AND n.deleted_at IS NULL
          AND n.tipo_notificacion IN (
            'solicitud_participacion_comisionista_chat_pendiente',
            'solicitud_participacion_comisionista_chat_aceptada',
            'solicitud_participacion_comisionista_chat_rechazada'
          )
        ORDER BY n.created_at DESC
        LIMIT 1
      ) chat_request ON TRUE
      WHERE c.id = $1
        AND c.deleted_at IS NULL
      LIMIT 1
    `,
    [appointmentId]
  );

  return result.rows[0] || null;
}

async function findVideoConsultationByAppointmentId(appointmentId) {
  await ensureVideoConsultationSchema();

  const result = await query(
    `
      SELECT
        vc.id,
        vc.cita_id AS "appointmentId",
        vc.proveedor AS provider,
        vc.proveedor_sala_id AS "providerRoomId",
        vc.url_sala AS "roomUrl",
        vc.estado AS status,
        vc.fecha_habilitacion_acceso AS "accessStartsAt",
        vc.fecha_expiracion_acceso AS "accessEndsAt",
        vc.fecha_inicio_real AS "startedAt",
        vc.fecha_fin_real AS "endedAt",
        vc.url_grabacion AS "recordingUrl",
        vc.metadata,
        vc.created_at AS "createdAt",
        vc.updated_at AS "updatedAt"
      FROM video_consulta vc
      WHERE vc.cita_id = $1
        AND vc.deleted_at IS NULL
      LIMIT 1
    `,
    [appointmentId]
  );

  return result.rows[0] || null;
}

async function findVideoConsultationById(videoConsultationId) {
  await ensureVideoConsultationSchema();

  const result = await query(
    `
      SELECT
        vc.id,
        vc.cita_id AS "appointmentId",
        vc.proveedor AS provider,
        vc.proveedor_sala_id AS "providerRoomId",
        vc.url_sala AS "roomUrl",
        vc.estado AS status,
        vc.fecha_habilitacion_acceso AS "accessStartsAt",
        vc.fecha_expiracion_acceso AS "accessEndsAt",
        vc.fecha_inicio_real AS "startedAt",
        vc.fecha_fin_real AS "endedAt",
        vc.url_grabacion AS "recordingUrl",
        vc.metadata,
        vc.created_at AS "createdAt",
        vc.updated_at AS "updatedAt"
      FROM video_consulta vc
      WHERE vc.id = $1
        AND vc.deleted_at IS NULL
      LIMIT 1
    `,
    [videoConsultationId]
  );

  return result.rows[0] || null;
}

async function createVideoConsultation(payload) {
  await ensureVideoConsultationSchema();

  const result = await query(
    `
      INSERT INTO video_consulta (
        cita_id,
        proveedor,
        proveedor_sala_id,
        url_sala,
        estado,
        fecha_habilitacion_acceso,
        fecha_expiracion_acceso,
        url_grabacion,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id,
        cita_id AS "appointmentId",
        proveedor AS provider,
        proveedor_sala_id AS "providerRoomId",
        url_sala AS "roomUrl",
        estado AS status,
        fecha_habilitacion_acceso AS "accessStartsAt",
        fecha_expiracion_acceso AS "accessEndsAt",
        fecha_inicio_real AS "startedAt",
        fecha_fin_real AS "endedAt",
        url_grabacion AS "recordingUrl",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [
      payload.appointmentId,
      payload.provider,
      payload.providerRoomId,
      payload.roomUrl,
      payload.status,
      payload.accessStartsAt,
      payload.accessEndsAt,
      payload.recordingUrl || null,
      payload.metadata ? JSON.stringify(payload.metadata) : null
    ]
  );

  return result.rows[0];
}

async function updateVideoConsultation(videoConsultationId, payload) {
  await ensureVideoConsultationSchema();

  const result = await query(
    `
      UPDATE video_consulta
      SET
        proveedor = COALESCE($2, proveedor),
        proveedor_sala_id = COALESCE($3, proveedor_sala_id),
        url_sala = COALESCE($4, url_sala),
        estado = COALESCE($5, estado),
        fecha_habilitacion_acceso = COALESCE($6, fecha_habilitacion_acceso),
        fecha_expiracion_acceso = COALESCE($7, fecha_expiracion_acceso),
        fecha_inicio_real = COALESCE($8, fecha_inicio_real),
        fecha_fin_real = COALESCE($9, fecha_fin_real),
        url_grabacion = COALESCE($10, url_grabacion),
        metadata = COALESCE($11, metadata),
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        cita_id AS "appointmentId",
        proveedor AS provider,
        proveedor_sala_id AS "providerRoomId",
        url_sala AS "roomUrl",
        estado AS status,
        fecha_habilitacion_acceso AS "accessStartsAt",
        fecha_expiracion_acceso AS "accessEndsAt",
        fecha_inicio_real AS "startedAt",
        fecha_fin_real AS "endedAt",
        url_grabacion AS "recordingUrl",
        metadata,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `,
    [
      videoConsultationId,
      payload.provider || null,
      payload.providerRoomId || null,
      payload.roomUrl || null,
      payload.status || null,
      payload.accessStartsAt || null,
      payload.accessEndsAt || null,
      payload.startedAt || null,
      payload.endedAt || null,
      payload.recordingUrl || null,
      payload.metadata ? JSON.stringify(payload.metadata) : null
    ]
  );

  return result.rows[0] || null;
}

async function updateAppointmentStatus(appointmentId, status) {
  const result = await query(
    `
      UPDATE cita
      SET estado = $2,
          updated_at = NOW()
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING id, estado AS status
    `,
    [appointmentId, status]
  );

  return result.rows[0] || null;
}

async function createVideoMessage(payload) {
  await ensureVideoConsultationSchema();

  const result = await query(
    `
      INSERT INTO mensaje_video_consulta (
        video_consulta_id,
        remitente_usuario_id,
        rol_remitente,
        tipo_mensaje,
        contenido,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        video_consulta_id AS "videoConsultationId",
        remitente_usuario_id AS "senderUserId",
        rol_remitente AS "senderRole",
        tipo_mensaje AS type,
        contenido AS content,
        metadata,
        created_at AS "createdAt"
    `,
    [
      payload.videoConsultationId,
      payload.senderUserId,
      payload.senderRole,
      payload.type || 'texto',
      payload.content,
      payload.metadata ? JSON.stringify(payload.metadata) : null
    ]
  );

  return result.rows[0];
}

async function listVideoMessages(videoConsultationId) {
  await ensureVideoConsultationSchema();

  const result = await query(
    `
      SELECT
        m.id,
        m.video_consulta_id AS "videoConsultationId",
        m.remitente_usuario_id AS "senderUserId",
        u.correo_electronico AS email,
        m.rol_remitente AS "senderRole",
        m.tipo_mensaje AS type,
        m.contenido AS content,
        m.metadata,
        m.created_at AS "createdAt"
      FROM mensaje_video_consulta m
      INNER JOIN usuario u ON u.id = m.remitente_usuario_id
      WHERE m.video_consulta_id = $1
        AND m.deleted_at IS NULL
      ORDER BY m.created_at ASC
    `,
    [videoConsultationId]
  );

  return result.rows;
}

async function listVideoConsultations(filters = {}) {
  await ensureVideoConsultationSchema();

  const values = [];
  const conditions = ['vc.deleted_at IS NULL', 'c.deleted_at IS NULL'];

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`vc.estado = $${values.length}`);
  }

  if (filters.provider) {
    values.push(filters.provider);
    conditions.push(`vc.proveedor = $${values.length}`);
  }

  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(`(
      CONCAT(pp.nombres, ' ', pp.apellidos) ILIKE $${values.length}
      OR CONCAT(pm.nombres, ' ', pm.apellidos) ILIKE $${values.length}
      OR COALESCE(vc.proveedor_sala_id, '') ILIKE $${values.length}
    )`);
  }

  values.push(Number(filters.limit || 50));
  const limitParam = values.length;
  values.push(Number(filters.offset || 0));
  const offsetParam = values.length;

  const result = await query(
    `
      SELECT
        vc.id,
        vc.cita_id AS "appointmentId",
        vc.proveedor AS provider,
        vc.proveedor_sala_id AS "providerRoomId",
        vc.url_sala AS "roomUrl",
        vc.estado AS status,
        vc.fecha_habilitacion_acceso AS "accessStartsAt",
        vc.fecha_expiracion_acceso AS "accessEndsAt",
        vc.fecha_inicio_real AS "startedAt",
        vc.fecha_fin_real AS "endedAt",
        vc.url_grabacion AS "recordingUrl",
        c.estado AS "appointmentStatus",
        c.fecha_hora_inicio_programada AS "scheduledStartAt",
        c.fecha_hora_fin_programada AS "scheduledEndAt",
        CONCAT(pp.nombres, ' ', pp.apellidos) AS patient,
        CONCAT(pm.nombres, ' ', pm.apellidos) AS doctor,
        COUNT(*) OVER()::int AS total
      FROM video_consulta vc
      INNER JOIN cita c ON c.id = vc.cita_id
      INNER JOIN perfil_paciente pp ON pp.id = c.paciente_id
      INNER JOIN perfil_medico pm ON pm.id = c.medico_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY c.fecha_hora_inicio_programada DESC
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

async function touchVideoSessionStatusByAppointment(appointmentId, status) {
  await ensureVideoConsultationSchema();

  const result = await query(
    `
      UPDATE video_consulta
      SET estado = $2,
          updated_at = NOW()
      WHERE cita_id = $1
        AND deleted_at IS NULL
      RETURNING id
    `,
    [appointmentId, status]
  );

  return result.rows[0] || null;
}

module.exports = {
  ensureVideoConsultationSchema,
  createVideoConsultation,
  createVideoMessage,
  findAppointmentContext,
  findVideoConsultationByAppointmentId,
  findVideoConsultationById,
  listVideoConsultations,
  listVideoMessages,
  touchVideoSessionStatusByAppointment,
  updateAppointmentStatus,
  updateVideoConsultation
};
