const { query, withTransaction } = require('../../database/query');

async function findUserById(userId) {
  const result = await query(
    `
      SELECT
        id,
        correo_electronico AS email,
        rol_codigo AS role,
        estado AS status
      FROM usuario
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function findDisplayProfile(userId) {
  const result = await query(
    `
      SELECT nombres, apellidos, 'paciente' AS role
      FROM perfil_paciente
      WHERE usuario_id = $1 AND deleted_at IS NULL
      UNION ALL
      SELECT nombres, apellidos, 'medico' AS role
      FROM perfil_medico
      WHERE usuario_id = $1 AND deleted_at IS NULL
      UNION ALL
      SELECT nombres, apellidos, 'comisionista' AS role
      FROM perfil_comisionista
      WHERE usuario_id = $1 AND deleted_at IS NULL
      UNION ALL
      SELECT nombre_mostrar AS nombres, NULL::varchar AS apellidos, 'administrador' AS role
      FROM perfil_administrador
      WHERE usuario_id = $1 AND deleted_at IS NULL
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function isPatientLinkedToCommissioner(patientUserId, commissionerUserId) {
  const result = await query(
    `
      SELECT 1
      FROM cita c
      INNER JOIN perfil_paciente pp ON pp.id = c.paciente_id
      LEFT JOIN perfil_comisionista pc ON pc.id = c.comisionista_id
      LEFT JOIN codigo_referido cr ON cr.id = c.codigo_referido_id
      WHERE pp.usuario_id = $1
        AND (pc.usuario_id = $2 OR cr.usuario_id = $2)
        AND c.deleted_at IS NULL
      LIMIT 1
    `,
    [patientUserId, commissionerUserId]
  );

  return result.rowCount > 0;
}

async function isDoctorLinkedToCommissioner(doctorUserId, commissionerUserId) {
  const result = await query(
    `
      SELECT 1
      FROM cita c
      INNER JOIN perfil_medico pm ON pm.id = c.medico_id
      LEFT JOIN perfil_comisionista pc ON pc.id = c.comisionista_id
      LEFT JOIN codigo_referido cr ON cr.id = c.codigo_referido_id
      WHERE pm.usuario_id = $1
        AND (pc.usuario_id = $2 OR cr.usuario_id = $2)
        AND c.deleted_at IS NULL
      LIMIT 1
    `,
    [doctorUserId, commissionerUserId]
  );

  return result.rowCount > 0;
}

async function findConversationBetweenUsers(userA, userB, type) {
  const result = await query(
    `
      SELECT c.id
      FROM conversacion c
      INNER JOIN participante_conversacion p1 ON p1.conversacion_id = c.id AND p1.deleted_at IS NULL
      INNER JOIN participante_conversacion p2 ON p2.conversacion_id = c.id AND p2.deleted_at IS NULL
      WHERE c.tipo_conversacion = $3
        AND c.deleted_at IS NULL
        AND p1.usuario_id = $1
        AND p2.usuario_id = $2
      LIMIT 1
    `,
    [userA, userB, type]
  );

  return result.rows[0]?.id || null;
}

async function createConversation({ type, subject, participants, contextType = null, contextId = null }) {
  return withTransaction(async (client) => {
    const conversationResult = await client.query(
      `
        INSERT INTO conversacion (
          tipo_conversacion,
          asunto,
          estado,
          contexto_tipo,
          contexto_id,
          ultimo_mensaje_at
        )
        VALUES ($1, $2, 'activa', $3, $4, NOW())
        RETURNING id, tipo_conversacion AS type, asunto AS subject, estado AS status, ultimo_mensaje_at AS "lastMessageAt"
      `,
      [type, subject || null, contextType, contextId]
    );

    const conversation = conversationResult.rows[0];

    for (const participant of participants) {
      await client.query(
        `
          INSERT INTO participante_conversacion (
            conversacion_id,
            usuario_id,
            rol_usuario
          )
          VALUES ($1, $2, $3)
        `,
        [conversation.id, participant.userId, participant.role]
      );
    }

    return conversation;
  });
}

async function listConversationsForUser(userId, filters = {}) {
  const values = [userId];
  const conditions = ['pc.usuario_id = $1', 'pc.deleted_at IS NULL', 'c.deleted_at IS NULL'];

  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(`(COALESCE(c.asunto, '') ILIKE $${values.length} OR EXISTS (
      SELECT 1
      FROM participante_conversacion pcx
      INNER JOIN usuario ux ON ux.id = pcx.usuario_id
      WHERE pcx.conversacion_id = c.id
        AND pcx.deleted_at IS NULL
        AND ux.correo_electronico ILIKE $${values.length}
    ))`);
  }

  const result = await query(
    `
      SELECT
        c.id,
        c.tipo_conversacion AS type,
        c.asunto AS subject,
        c.estado AS status,
        c.contexto_tipo AS "contextType",
        c.contexto_id AS "contextId",
        c.ultimo_mensaje_at AS "lastMessageAt",
        (
          SELECT COUNT(*)::int
          FROM mensaje_conversacion m
          WHERE m.conversacion_id = c.id
            AND m.deleted_at IS NULL
            AND m.created_at > COALESCE(pc.ultima_lectura_at, TIMESTAMPTZ 'epoch')
            AND m.remitente_usuario_id <> $1
        ) AS "unreadCount"
      FROM conversacion c
      INNER JOIN participante_conversacion pc ON pc.conversacion_id = c.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY COALESCE(c.ultimo_mensaje_at, c.created_at) DESC
    `,
    values
  );

  return result.rows;
}

async function getConversationById(conversationId) {
  const result = await query(
    `
      SELECT
        c.id,
        c.tipo_conversacion AS type,
        c.asunto AS subject,
        c.estado AS status,
        c.contexto_tipo AS "contextType",
        c.contexto_id AS "contextId",
        c.ultimo_mensaje_at AS "lastMessageAt"
      FROM conversacion c
      WHERE c.id = $1
        AND c.deleted_at IS NULL
      LIMIT 1
    `,
    [conversationId]
  );

  return result.rows[0] || null;
}

async function listConversationParticipants(conversationId) {
  const result = await query(
    `
      SELECT
        pc.usuario_id AS "userId",
        pc.rol_usuario AS role,
        pc.ultima_lectura_at AS "lastReadAt",
        u.correo_electronico AS email
      FROM participante_conversacion pc
      INNER JOIN usuario u ON u.id = pc.usuario_id
      WHERE pc.conversacion_id = $1
        AND pc.deleted_at IS NULL
      ORDER BY pc.created_at ASC
    `,
    [conversationId]
  );

  return result.rows;
}

async function listMessages(conversationId) {
  const result = await query(
    `
      SELECT
        m.id,
        m.remitente_usuario_id AS "senderUserId",
        u.correo_electronico AS email,
        u.rol_codigo AS role,
        m.tipo_mensaje AS type,
        m.contenido AS content,
        m.estado AS status,
        m.created_at AS "createdAt",
        m.metadata
      FROM mensaje_conversacion m
      INNER JOIN usuario u ON u.id = m.remitente_usuario_id
      WHERE m.conversacion_id = $1
        AND m.deleted_at IS NULL
      ORDER BY m.created_at ASC
    `,
    [conversationId]
  );

  return result.rows;
}

async function createMessage(conversationId, senderUserId, content, type = 'texto', metadata = null) {
  return withTransaction(async (client) => {
    const result = await client.query(
      `
        INSERT INTO mensaje_conversacion (
          conversacion_id,
          remitente_usuario_id,
          tipo_mensaje,
          contenido,
          metadata,
          estado
        )
        VALUES ($1, $2, $3, $4, $5, 'enviado')
        RETURNING
          id,
          conversacion_id AS "conversationId",
          remitente_usuario_id AS "senderUserId",
          tipo_mensaje AS type,
          contenido AS content,
          estado AS status,
          created_at AS "createdAt",
          metadata
      `,
      [conversationId, senderUserId, type, content, metadata ? JSON.stringify(metadata) : null]
    );

    await client.query(
      `
        UPDATE conversacion
        SET ultimo_mensaje_at = NOW(),
            updated_at = NOW()
        WHERE id = $1
      `,
      [conversationId]
    );

    return result.rows[0];
  });
}

async function listAvailableContacts(userId, role, search = '') {
  const normalizedSearch = search ? `%${search}%` : null;

  const queriesByRole = {
    paciente: {
      sql: `
        SELECT DISTINCT
          u.id AS "userId",
          u.rol_codigo AS role,
          u.correo_electronico AS email,
          CONCAT(pc.nombres, ' ', pc.apellidos) AS "displayName"
        FROM cita c
        INNER JOIN perfil_paciente pp ON pp.id = c.paciente_id
        INNER JOIN perfil_comisionista pc ON pc.id = c.comisionista_id
        INNER JOIN usuario u ON u.id = pc.usuario_id
        WHERE pp.usuario_id = $1
          AND c.deleted_at IS NULL
          AND pc.deleted_at IS NULL
          AND u.deleted_at IS NULL
          AND ($2::text IS NULL OR CONCAT(pc.nombres, ' ', pc.apellidos) ILIKE $2 OR u.correo_electronico ILIKE $2)
        ORDER BY "displayName" ASC
      `
    },
    medico: {
      sql: `
        SELECT DISTINCT
          u.id AS "userId",
          u.rol_codigo AS role,
          u.correo_electronico AS email,
          CONCAT(pc.nombres, ' ', pc.apellidos) AS "displayName"
        FROM cita c
        INNER JOIN perfil_medico pm ON pm.id = c.medico_id
        INNER JOIN perfil_comisionista pc ON pc.id = c.comisionista_id
        INNER JOIN usuario u ON u.id = pc.usuario_id
        WHERE pm.usuario_id = $1
          AND c.deleted_at IS NULL
          AND pc.deleted_at IS NULL
          AND u.deleted_at IS NULL
          AND ($2::text IS NULL OR CONCAT(pc.nombres, ' ', pc.apellidos) ILIKE $2 OR u.correo_electronico ILIKE $2)
        ORDER BY "displayName" ASC
      `
    },
    comisionista: {
      sql: `
        SELECT DISTINCT
          u.id AS "userId",
          u.rol_codigo AS role,
          u.correo_electronico AS email,
          CASE
            WHEN u.rol_codigo = 'paciente' THEN CONCAT(pp.nombres, ' ', pp.apellidos)
            WHEN u.rol_codigo = 'medico' THEN CONCAT(pm.nombres, ' ', pm.apellidos)
            ELSE u.correo_electronico
          END AS "displayName"
        FROM (
          SELECT pp.usuario_id AS related_user_id
          FROM cita c
          INNER JOIN perfil_comisionista pc ON pc.id = c.comisionista_id
          INNER JOIN perfil_paciente pp ON pp.id = c.paciente_id
          WHERE pc.usuario_id = $1
            AND c.deleted_at IS NULL
          UNION
          SELECT pm.usuario_id AS related_user_id
          FROM cita c
          INNER JOIN perfil_comisionista pc ON pc.id = c.comisionista_id
          INNER JOIN perfil_medico pm ON pm.id = c.medico_id
          WHERE pc.usuario_id = $1
            AND c.deleted_at IS NULL
        ) rel
        INNER JOIN usuario u ON u.id = rel.related_user_id
        LEFT JOIN perfil_paciente pp ON pp.usuario_id = u.id AND pp.deleted_at IS NULL
        LEFT JOIN perfil_medico pm ON pm.usuario_id = u.id AND pm.deleted_at IS NULL
        WHERE u.deleted_at IS NULL
          AND ($2::text IS NULL OR COALESCE(CONCAT(pp.nombres, ' ', pp.apellidos), CONCAT(pm.nombres, ' ', pm.apellidos), u.correo_electronico) ILIKE $2 OR u.correo_electronico ILIKE $2)
        ORDER BY "displayName" ASC
      `
    },
    administrador: {
      sql: `
        SELECT
          u.id AS "userId",
          u.rol_codigo AS role,
          u.correo_electronico AS email,
          CASE
            WHEN u.rol_codigo = 'comisionista' THEN CONCAT(pc.nombres, ' ', pc.apellidos)
            WHEN u.rol_codigo = 'medico' THEN CONCAT(pm.nombres, ' ', pm.apellidos)
            ELSE u.correo_electronico
          END AS "displayName"
        FROM usuario u
        LEFT JOIN perfil_comisionista pc ON pc.usuario_id = u.id AND pc.deleted_at IS NULL
        LEFT JOIN perfil_medico pm ON pm.usuario_id = u.id AND pm.deleted_at IS NULL
        WHERE u.rol_codigo IN ('comisionista', 'medico')
          AND u.deleted_at IS NULL
          AND ($2::text IS NULL OR COALESCE(CONCAT(pc.nombres, ' ', pc.apellidos), CONCAT(pm.nombres, ' ', pm.apellidos), u.correo_electronico) ILIKE $2 OR u.correo_electronico ILIKE $2)
        ORDER BY "displayName" ASC
      `
    }
  };

  const config = queriesByRole[role];
  if (!config) {
    return [];
  }

  const result = await query(config.sql, [userId, normalizedSearch]);
  return result.rows;
}

async function markConversationRead(conversationId, userId) {
  const result = await query(
    `
      UPDATE participante_conversacion
      SET ultima_lectura_at = NOW(),
          updated_at = NOW()
      WHERE conversacion_id = $1
        AND usuario_id = $2
        AND deleted_at IS NULL
      RETURNING conversacion_id AS "conversationId", ultima_lectura_at AS "lastReadAt"
    `,
    [conversationId, userId]
  );

  return result.rows[0] || null;
}

module.exports = {
  createConversation,
  createMessage,
  findConversationBetweenUsers,
  findDisplayProfile,
  findUserById,
  getConversationById,
  isDoctorLinkedToCommissioner,
  isPatientLinkedToCommissioner,
  listAvailableContacts,
  listConversationParticipants,
  listConversationsForUser,
  listMessages,
  markConversationRead
};
