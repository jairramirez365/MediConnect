const { query, withTransaction } = require('../../database/query');

async function createNotification(clientOrPool, payload) {
  const executor = clientOrPool.query ? clientOrPool : { query };
  const result = await executor.query(
    `
      INSERT INTO notificacion (
        usuario_id,
        cita_id,
        tipo_notificacion,
        tipo_evento,
        canal,
        destinatario,
        proveedor,
        mensaje,
        estado,
        intentos_envio,
        fecha_programada_envio,
        fecha_envio,
        fecha_entrega,
        payload,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING
        id,
        usuario_id AS "userId",
        cita_id AS "appointmentId",
        tipo_notificacion AS type,
        tipo_evento AS "eventType",
        canal AS channel,
        destinatario AS destination,
        proveedor AS provider,
        mensaje AS message,
        estado AS status,
        intentos_envio AS "attemptsCount",
        fecha_programada_envio AS "scheduledAt",
        fecha_envio AS "sentAt",
        fecha_entrega AS "deliveredAt",
        fecha_lectura AS "readAt",
        error_envio AS "deliveryError",
        payload,
        metadata,
        created_at AS "createdAt"
    `,
    [
      payload.userId,
      payload.appointmentId || null,
      payload.type,
      payload.eventType || null,
      payload.channel,
      payload.destination || null,
      payload.provider || null,
      payload.message,
      payload.status || 'programada',
      payload.attemptsCount || 0,
      payload.scheduledAt || new Date(),
      payload.sentAt || null,
      payload.deliveredAt || null,
      payload.payload ? JSON.stringify(payload.payload) : null,
      payload.metadata ? JSON.stringify(payload.metadata) : null
    ]
  );

  return result.rows[0];
}

async function updateNotificationAttempt(notificationId, payload) {
  const result = await query(
    `
      UPDATE notificacion
      SET
        estado = $2,
        proveedor = COALESCE($3, proveedor),
        proveedor_mensaje_id = COALESCE($4, proveedor_mensaje_id),
        intentos_envio = COALESCE($5, intentos_envio),
        ultimo_intento_envio = COALESCE($6, ultimo_intento_envio),
        fecha_envio = COALESCE($7, fecha_envio),
        fecha_entrega = COALESCE($8, fecha_entrega),
        error_envio = $9,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        estado AS status,
        proveedor AS provider,
        proveedor_mensaje_id AS "providerMessageId",
        intentos_envio AS "attemptsCount",
        fecha_envio AS "sentAt",
        fecha_entrega AS "deliveredAt",
        error_envio AS "deliveryError"
    `,
    [
      notificationId,
      payload.status,
      payload.provider || null,
      payload.providerMessageId || null,
      payload.attemptsCount || null,
      payload.lastAttemptAt || null,
      payload.sentAt || null,
      payload.deliveredAt || null,
      payload.deliveryError || null
    ]
  );

  return result.rows[0] || null;
}

async function markNotificationRead(notificationId, userId) {
  const result = await query(
    `
      UPDATE notificacion
      SET fecha_lectura = COALESCE(fecha_lectura, NOW()),
          updated_at = NOW()
      WHERE id = $1
        AND usuario_id = $2
        AND deleted_at IS NULL
      RETURNING id, fecha_lectura AS "readAt"
    `,
    [notificationId, userId]
  );

  return result.rows[0] || null;
}

async function findNotificationById(notificationId) {
  const result = await query(
    `
      SELECT
        id,
        usuario_id AS "userId",
        cita_id AS "appointmentId",
        tipo_notificacion AS type,
        tipo_evento AS "eventType",
        canal AS channel,
        destinatario AS destination,
        proveedor AS provider,
        proveedor_mensaje_id AS "providerMessageId",
        mensaje AS message,
        estado AS status,
        intentos_envio AS "attemptsCount",
        ultimo_intento_envio AS "lastAttemptAt",
        fecha_programada_envio AS "scheduledAt",
        fecha_envio AS "sentAt",
        fecha_entrega AS "deliveredAt",
        fecha_lectura AS "readAt",
        error_envio AS "deliveryError",
        payload,
        metadata,
        created_at AS "createdAt"
      FROM notificacion
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [notificationId]
  );

  return result.rows[0] || null;
}

async function listNotificationsForUser(userId, filters = {}) {
  const values = [userId];
  const conditions = ['n.usuario_id = $1', 'n.deleted_at IS NULL'];

  if (filters.readState === 'read') {
    conditions.push('n.fecha_lectura IS NOT NULL');
  }

  if (filters.readState === 'unread') {
    conditions.push('n.fecha_lectura IS NULL');
  }

  if (filters.eventType) {
    values.push(filters.eventType);
    conditions.push(`n.tipo_evento = $${values.length}`);
  }

  const limit = Number(filters.limit || 20);
  const offset = Number(filters.offset || 0);
  values.push(limit);
  const limitParam = values.length;
  values.push(offset);
  const offsetParam = values.length;

  const result = await query(
    `
      SELECT
        n.id,
        n.cita_id AS "appointmentId",
        n.tipo_notificacion AS type,
        n.tipo_evento AS "eventType",
        n.canal AS channel,
        n.destinatario AS destination,
        n.mensaje AS message,
        n.estado AS status,
        n.fecha_programada_envio AS "scheduledAt",
        n.fecha_envio AS "sentAt",
        n.fecha_entrega AS "deliveredAt",
        n.fecha_lectura AS "readAt",
        n.error_envio AS "deliveryError",
        n.payload,
        n.metadata,
        COUNT(*) OVER()::int AS total
      FROM notificacion n
      WHERE ${conditions.join(' AND ')}
      ORDER BY n.created_at DESC
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

async function countUnreadNotifications(userId) {
  const result = await query(
    `
      SELECT COUNT(*)::int AS total
      FROM notificacion
      WHERE usuario_id = $1
        AND fecha_lectura IS NULL
        AND deleted_at IS NULL
    `,
    [userId]
  );

  return result.rows[0]?.total || 0;
}

async function listNotificationsAdmin(filters = {}) {
  const values = [];
  const conditions = ['n.deleted_at IS NULL'];

  if (filters.userId) {
    values.push(filters.userId);
    conditions.push(`n.usuario_id = $${values.length}`);
  }

  if (filters.channel) {
    values.push(filters.channel);
    conditions.push(`n.canal = $${values.length}`);
  }

  if (filters.eventType) {
    values.push(filters.eventType);
    conditions.push(`n.tipo_evento = $${values.length}`);
  }

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`n.estado = $${values.length}`);
  }

  if (filters.dateFrom) {
    values.push(filters.dateFrom);
    conditions.push(`n.created_at >= $${values.length}::timestamptz`);
  }

  if (filters.dateTo) {
    values.push(filters.dateTo);
    conditions.push(`n.created_at <= $${values.length}::timestamptz`);
  }

  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(`(u.correo_electronico ILIKE $${values.length} OR n.mensaje ILIKE $${values.length})`);
  }

  const limit = Number(filters.limit || 50);
  const offset = Number(filters.offset || 0);
  values.push(limit);
  const limitParam = values.length;
  values.push(offset);
  const offsetParam = values.length;

  const result = await query(
    `
      SELECT
        n.id,
        n.usuario_id AS "userId",
        u.correo_electronico AS email,
        u.rol_codigo AS role,
        n.cita_id AS "appointmentId",
        n.tipo_notificacion AS type,
        n.tipo_evento AS "eventType",
        n.canal AS channel,
        n.destinatario AS destination,
        n.proveedor AS provider,
        n.proveedor_mensaje_id AS "providerMessageId",
        n.mensaje AS message,
        n.estado AS status,
        n.intentos_envio AS "attemptsCount",
        n.ultimo_intento_envio AS "lastAttemptAt",
        n.fecha_programada_envio AS "scheduledAt",
        n.fecha_envio AS "sentAt",
        n.fecha_entrega AS "deliveredAt",
        n.fecha_lectura AS "readAt",
        n.error_envio AS "deliveryError",
        n.payload,
        n.metadata,
        COUNT(*) OVER()::int AS total
      FROM notificacion n
      INNER JOIN usuario u ON u.id = n.usuario_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY n.created_at DESC
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

async function getUserNotificationPreferences(userId) {
  const result = await query(
    `
      SELECT
        id,
        correo_electronico AS email,
        telefono AS phone,
        rol_codigo AS role,
        correo_verificado_at AS "emailVerifiedAt",
        telefono_verificado_at AS "phoneVerifiedAt"
      FROM usuario
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function getAppointmentNotificationContext(appointmentId) {
  const result = await query(
    `
      SELECT
        c.id,
        c.estado AS status,
        c.canal_atencion AS "careChannel",
        c.fecha_hora_inicio_programada AS "scheduledStartAt",
        c.fecha_hora_fin_programada AS "scheduledEndAt",
        c.tipo_consulta AS "appointmentType",
        CONCAT(pp.nombres, ' ', pp.apellidos) AS patient,
        pu.id AS "patientUserId",
        pu.correo_electronico AS "patientEmail",
        pu.telefono AS "patientPhone",
        CONCAT(pm.nombres, ' ', pm.apellidos) AS doctor,
        du.id AS "doctorUserId",
        du.correo_electronico AS "doctorEmail",
        du.telefono AS "doctorPhone",
        COALESCE((
          SELECT STRING_AGG(e.nombre, ', ' ORDER BY me.es_principal DESC, e.nombre)
          FROM medico_especialidad me
          INNER JOIN especialidad e ON e.id = me.especialidad_id
          WHERE me.medico_id = pm.id
            AND me.deleted_at IS NULL
            AND e.deleted_at IS NULL
        ), 'Especialidad activa') AS specialty
      FROM cita c
      INNER JOIN perfil_paciente pp ON pp.id = c.paciente_id
      INNER JOIN usuario pu ON pu.id = pp.usuario_id
      INNER JOIN perfil_medico pm ON pm.id = c.medico_id
      INNER JOIN usuario du ON du.id = pm.usuario_id
      WHERE c.id = $1
        AND c.deleted_at IS NULL
      LIMIT 1
    `,
    [appointmentId]
  );

  return result.rows[0] || null;
}

async function hasNotificationForAppointmentEvent(appointmentId, eventType, channel) {
  const result = await query(
    `
      SELECT 1
      FROM notificacion
      WHERE cita_id = $1
        AND tipo_evento = $2
        AND canal = $3
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [appointmentId, eventType, channel]
  );

  return result.rowCount > 0;
}

async function listAppointmentsStartingBefore(dateLimit) {
  const result = await query(
    `
      SELECT id
      FROM cita
      WHERE estado IN ('confirmada', 'pendiente_confirmacion')
        AND fecha_hora_inicio_programada BETWEEN NOW() AND $1::timestamptz
        AND deleted_at IS NULL
    `,
    [dateLimit]
  );

  return result.rows.map((row) => row.id);
}

module.exports = {
  countUnreadNotifications,
  createNotification,
  findNotificationById,
  getAppointmentNotificationContext,
  getUserNotificationPreferences,
  hasNotificationForAppointmentEvent,
  listAppointmentsStartingBefore,
  listNotificationsAdmin,
  listNotificationsForUser,
  markNotificationRead,
  updateNotificationAttempt,
  withTransaction
};
