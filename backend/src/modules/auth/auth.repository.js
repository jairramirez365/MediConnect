const { query, withTransaction } = require('../../database/query');

const safeUserFields = `
  id,
  correo_electronico AS email,
  telefono AS phone,
  rol_codigo AS role,
  estado AS status,
  fecha_ultimo_acceso AS "lastLoginAt",
  created_at AS "createdAt"
`;

async function findUserByEmail(email) {
  const result = await query(
    `
      SELECT
        ${safeUserFields},
        contrasena_hash AS "passwordHash"
      FROM usuario
      WHERE correo_electronico = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [email]
  );

  return result.rows[0] || null;
}

async function findUserById(userId) {
  const result = await query(
    `
      SELECT ${safeUserFields}
      FROM usuario
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function createUser(payload) {
  const result = await query(
    `
      INSERT INTO usuario (
        correo_electronico,
        telefono,
        contrasena_hash,
        rol_codigo,
        estado
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING ${safeUserFields}
    `,
    [
      payload.email,
      payload.phone || null,
      payload.passwordHash,
      payload.role,
      payload.status
    ]
  );

  return result.rows[0];
}

async function createUserWithProfile(payload) {
  return withTransaction(async (client) => {
    const userResult = await client.query(
      `
        INSERT INTO usuario (
          correo_electronico,
          telefono,
          contrasena_hash,
          rol_codigo,
          estado
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING ${safeUserFields}
      `,
      [
        payload.email,
        payload.phone || null,
        payload.passwordHash,
        payload.role,
        payload.status
      ]
    );

    const user = userResult.rows[0];
    let profile = null;

    if (payload.role === 'paciente') {
      const profileResult = await client.query(
        `
          INSERT INTO perfil_paciente (
            usuario_id,
            nombres,
            apellidos,
            tipo_documento,
            numero_documento,
            fecha_nacimiento,
            sexo,
            tipo_sangre,
            direccion,
            nombre_contacto_emergencia,
            telefono_contacto_emergencia,
            autorizo_participacion_comisionista_chat
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id, nombres, apellidos, numero_documento AS "documentNumber"
        `,
        [
          user.id,
          payload.profile.firstName,
          payload.profile.lastName,
          payload.profile.documentType,
          payload.profile.documentNumber,
          payload.profile.birthDate,
          payload.profile.gender || null,
          payload.profile.bloodType || null,
          payload.profile.address || null,
          payload.profile.emergencyContactName || null,
          payload.profile.emergencyContactPhone || null,
          Boolean(payload.profile.authorizesCommissionAgentChat)
        ]
      );

      profile = profileResult.rows[0];
    }

    if (payload.role === 'medico') {
      const profileResult = await client.query(
        `
          INSERT INTO perfil_medico (
            usuario_id,
            nombres,
            apellidos,
            tipo_documento,
            numero_documento,
            numero_registro_medico,
            biografia_profesional,
            anos_experiencia,
            valor_consulta,
            modalidad_atencion,
            ciudad,
            estado_validacion,
            fue_aprobado_por_administrador
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pendiente_documentacion', FALSE)
          RETURNING id, nombres, apellidos, numero_documento AS "documentNumber", estado_validacion AS "validationStatus"
        `,
        [
          user.id,
          payload.profile.firstName,
          payload.profile.lastName,
          payload.profile.documentType,
          payload.profile.documentNumber,
          payload.profile.medicalLicenseNumber,
          payload.profile.professionalBio || null,
          payload.profile.yearsOfExperience || 0,
          payload.profile.consultationFee,
          payload.profile.careMode,
          payload.profile.city
        ]
      );

      profile = profileResult.rows[0];
    }

    if (payload.role === 'comisionista') {
      const profileResult = await client.query(
        `
          INSERT INTO perfil_comisionista (
            usuario_id,
            nombres,
            apellidos,
            tipo_documento,
            numero_documento,
            codigo_referido_principal,
            porcentaje_comision_base,
            estado
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'activo')
          RETURNING id, nombres, apellidos, numero_documento AS "documentNumber", codigo_referido_principal AS "mainReferralCode"
        `,
        [
          user.id,
          payload.profile.firstName,
          payload.profile.lastName,
          payload.profile.documentType,
          payload.profile.documentNumber,
          payload.profile.mainReferralCode,
          payload.profile.baseCommissionPercentage
        ]
      );

      profile = profileResult.rows[0];
    }

    const balanceResult = await client.query(
      `
        INSERT INTO saldo_usuario (
          usuario_id,
          saldo_disponible,
          saldo_retenido,
          moneda
        )
        VALUES ($1, 0, 0, $2)
        RETURNING id, saldo_disponible AS "availableBalance", saldo_retenido AS "heldBalance", moneda AS currency
      `,
      [user.id, payload.currency || 'COP']
    );

    return {
      user,
      profile,
      balance: balanceResult.rows[0]
    };
  });
}

async function updateLastLogin(userId) {
  await query(
    `
      UPDATE usuario
      SET fecha_ultimo_acceso = NOW()
      WHERE id = $1
    `,
    [userId]
  );
}

module.exports = {
  createUser,
  createUserWithProfile,
  findUserByEmail,
  findUserById,
  updateLastLogin
};
