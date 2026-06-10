const { query, withTransaction } = require('../../database/query');

async function cancelPendingVerifications(userId, channel) {
  await query(
    `
      UPDATE verificacion_contacto
      SET estado = 'cancelada',
          updated_at = NOW()
      WHERE usuario_id = $1
        AND canal = $2
        AND estado IN ('pendiente', 'enviada', 'bloqueada')
        AND deleted_at IS NULL
    `,
    [userId, channel]
  );
}

async function createVerification(payload) {
  const result = await query(
    `
      INSERT INTO verificacion_contacto (
        usuario_id,
        canal,
        destino,
        codigo_hash,
        token_seguro,
        estado,
        intentos_validacion,
        max_intentos_validacion,
        intentos_reenvio,
        max_reenvios,
        fecha_expiracion,
        bloqueado_hasta,
        ultimo_envio_at,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, 0, $7, 0, $8, $9, NULL, NOW(), $10)
      RETURNING
        id,
        usuario_id AS "userId",
        canal AS channel,
        destino AS destination,
        estado AS status,
        intentos_validacion AS "attemptsCount",
        max_intentos_validacion AS "maxAttempts",
        intentos_reenvio AS "resendCount",
        max_reenvios AS "maxResends",
        fecha_expiracion AS "expiresAt",
        metadata
    `,
    [
      payload.userId,
      payload.channel,
      payload.destination,
      payload.codeHash,
      payload.secureToken,
      payload.status || 'enviada',
      payload.maxAttempts,
      payload.maxResends,
      payload.expiresAt,
      payload.metadata ? JSON.stringify(payload.metadata) : null
    ]
  );

  return result.rows[0];
}

async function findActiveVerification(userId, channel) {
  const result = await query(
    `
      SELECT
        id,
        usuario_id AS "userId",
        canal AS channel,
        destino AS destination,
        codigo_hash AS "codeHash",
        token_seguro AS "secureToken",
        estado AS status,
        intentos_validacion AS "attemptsCount",
        max_intentos_validacion AS "maxAttempts",
        intentos_reenvio AS "resendCount",
        max_reenvios AS "maxResends",
        fecha_expiracion AS "expiresAt",
        bloqueado_hasta AS "blockedUntil",
        verificado_at AS "verifiedAt",
        metadata
      FROM verificacion_contacto
      WHERE usuario_id = $1
        AND canal = $2
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [userId, channel]
  );

  return result.rows[0] || null;
}

async function incrementVerificationAttempt(verificationId, payload) {
  const result = await query(
    `
      UPDATE verificacion_contacto
      SET
        intentos_validacion = intentos_validacion + 1,
        estado = $2,
        bloqueado_hasta = $3,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        intentos_validacion AS "attemptsCount",
        estado AS status,
        bloqueado_hasta AS "blockedUntil"
    `,
    [verificationId, payload.status, payload.blockedUntil || null]
  );

  return result.rows[0] || null;
}

async function incrementResendAttempt(verificationId, expiresAt) {
  const result = await query(
    `
      UPDATE verificacion_contacto
      SET
        intentos_reenvio = intentos_reenvio + 1,
        fecha_expiracion = $2,
        ultimo_envio_at = NOW(),
        estado = 'enviada',
        updated_at = NOW()
      WHERE id = $1
      RETURNING intentos_reenvio AS "resendCount", max_reenvios AS "maxResends", fecha_expiracion AS "expiresAt"
    `,
    [verificationId, expiresAt]
  );

  return result.rows[0] || null;
}

async function updateVerificationSecret(verificationId, payload) {
  const result = await query(
    `
      UPDATE verificacion_contacto
      SET
        codigo_hash = $2,
        token_seguro = $3,
        metadata = $4,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `,
    [
      verificationId,
      payload.codeHash,
      payload.secureToken,
      payload.metadata ? JSON.stringify(payload.metadata) : null
    ]
  );

  return result.rows[0] || null;
}

async function markVerificationCompleted(verificationId) {
  const result = await query(
    `
      UPDATE verificacion_contacto
      SET
        estado = 'verificada',
        verificado_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        usuario_id AS "userId",
        canal AS channel,
        estado AS status,
        verificado_at AS "verifiedAt"
    `,
    [verificationId]
  );

  return result.rows[0] || null;
}

async function getVerificationStatus(userId) {
  const result = await query(
    `
      SELECT
        u.id,
        u.correo_electronico AS email,
        u.telefono AS phone,
        u.estado AS status,
        u.correo_verificado_at AS "emailVerifiedAt",
        u.telefono_verificado_at AS "phoneVerifiedAt",
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'channel', vc.canal,
              'destination', vc.destino,
              'status', vc.estado,
              'attemptsCount', vc.intentos_validacion,
              'maxAttempts', vc.max_intentos_validacion,
              'resendCount', vc.intentos_reenvio,
              'maxResends', vc.max_reenvios,
              'expiresAt', vc.fecha_expiracion,
              'blockedUntil', vc.bloqueado_hasta,
              'verifiedAt', vc.verificado_at
            )
          )
          FROM (
            SELECT DISTINCT ON (canal) *
            FROM verificacion_contacto
            WHERE usuario_id = u.id
              AND deleted_at IS NULL
            ORDER BY canal, created_at DESC
          ) vc
        ) AS channels
      FROM usuario u
      WHERE u.id = $1
        AND u.deleted_at IS NULL
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function markUserChannelVerified(userId, channel) {
  const emailVerifiedAt = channel === 'email' ? 'NOW()' : 'correo_verificado_at';
  const phoneVerifiedAt = ['sms', 'whatsapp'].includes(channel) ? 'NOW()' : 'telefono_verificado_at';

  const result = await query(
    `
      UPDATE usuario
      SET
        correo_verificado_at = ${emailVerifiedAt},
        telefono_verificado_at = ${phoneVerifiedAt},
        estado = CASE
          WHEN (CASE WHEN $2 = 'email' THEN TRUE ELSE correo_verificado_at IS NOT NULL END)
           AND (CASE WHEN $2 IN ('sms', 'whatsapp') THEN TRUE ELSE telefono_verificado_at IS NOT NULL END)
          THEN 'activo'
          ELSE estado
        END,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        correo_electronico AS email,
        telefono AS phone,
        rol_codigo AS role,
        estado AS status,
        correo_verificado_at AS "emailVerifiedAt",
        telefono_verificado_at AS "phoneVerifiedAt"
    `,
    [userId, channel]
  );

  return result.rows[0] || null;
}

async function findUserByIdentifier(identifier) {
  const result = await query(
    `
      SELECT
        id,
        correo_electronico AS email,
        telefono AS phone,
        rol_codigo AS role,
        estado AS status,
        correo_verificado_at AS "emailVerifiedAt",
        telefono_verificado_at AS "phoneVerifiedAt"
      FROM usuario
      WHERE (correo_electronico = $1 OR id::text = $1)
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [identifier]
  );

  return result.rows[0] || null;
}

module.exports = {
  cancelPendingVerifications,
  createVerification,
  findActiveVerification,
  findUserByIdentifier,
  getVerificationStatus,
  incrementResendAttempt,
  incrementVerificationAttempt,
  markUserChannelVerified,
  markVerificationCompleted,
  updateVerificationSecret,
  withTransaction
};
