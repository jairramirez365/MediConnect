const { query } = require('../../database/query');

async function getMyProfile(user) {
  const tableByRole = {
    paciente: 'perfil_paciente',
    medico: 'perfil_medico',
    comisionista: 'perfil_comisionista',
    administrador: 'perfil_administrador'
  };

  const table = tableByRole[user.role];
  if (!table) return null;

  const result = await query(
    `SELECT * FROM ${table} WHERE usuario_id = $1 AND deleted_at IS NULL LIMIT 1`,
    [user.sub]
  );

  return result.rows[0] || null;
}

async function updatePatientProfile(userId, payload) {
  const result = await query(
    `
      UPDATE perfil_paciente
      SET
        nombres = COALESCE($2, nombres),
        apellidos = COALESCE($3, apellidos),
        fecha_nacimiento = COALESCE($4, fecha_nacimiento),
        sexo = COALESCE($5, sexo),
        tipo_sangre = COALESCE($6, tipo_sangre),
        departamento = COALESCE($7, departamento),
        municipio = COALESCE($8, municipio),
        direccion = COALESCE($9, direccion),
        nombre_contacto_emergencia = COALESCE($10, nombre_contacto_emergencia),
        telefono_contacto_emergencia = COALESCE($11, telefono_contacto_emergencia),
        autorizo_participacion_comisionista_chat = COALESCE($12, autorizo_participacion_comisionista_chat)
      WHERE usuario_id = $1
        AND deleted_at IS NULL
      RETURNING id, nombres, apellidos, departamento, municipio, direccion, autorizo_participacion_comisionista_chat AS "authorizesCommissionAgentChat"
    `,
    [
      userId,
      payload.firstName || null,
      payload.lastName || null,
      payload.birthDate || null,
      payload.gender || null,
      payload.bloodType || null,
      payload.department || null,
      payload.municipality || null,
      payload.address || null,
      payload.emergencyContactName || null,
      payload.emergencyContactPhone || null,
      payload.authorizesCommissionAgentChat ?? null
    ]
  );

  return result.rows[0] || null;
}

async function updateDoctorProfile(userId, payload) {
  const result = await query(
    `
      UPDATE perfil_medico
      SET
        nombres = COALESCE($2, nombres),
        apellidos = COALESCE($3, apellidos),
        biografia_profesional = COALESCE($4, biografia_profesional),
        anos_experiencia = COALESCE($5, anos_experiencia),
        valor_consulta = COALESCE($6, valor_consulta),
        modalidad_atencion = COALESCE($7, modalidad_atencion),
        departamento = COALESCE($8, departamento),
        municipio = COALESCE($9, municipio),
        ciudad = COALESCE($10, ciudad)
      WHERE usuario_id = $1
        AND deleted_at IS NULL
      RETURNING id, nombres, apellidos, departamento, municipio, ciudad, modalidad_atencion AS "careMode", valor_consulta AS "consultationFee"
    `,
    [
      userId,
      payload.firstName || null,
      payload.lastName || null,
      payload.professionalBio || null,
      payload.yearsOfExperience ?? null,
      payload.consultationFee ?? null,
      payload.careMode || null,
      payload.department || null,
      payload.municipality || null,
      payload.municipality || payload.city || null
    ]
  );

  return result.rows[0] || null;
}

module.exports = {
  getMyProfile,
  updateDoctorProfile,
  updatePatientProfile
};
