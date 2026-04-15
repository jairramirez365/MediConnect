const { query, withTransaction } = require('../../database/query');

async function findAppointmentForClinical(appointmentId) {
  const result = await query(
    `
      SELECT
        c.id,
        c.estado AS status,
        c.paciente_id AS "patientId",
        pp.usuario_id AS "patientUserId",
        c.medico_id AS "doctorId",
        pm.usuario_id AS "doctorUserId"
      FROM cita c
      INNER JOIN perfil_paciente pp ON pp.id = c.paciente_id
      INNER JOIN perfil_medico pm ON pm.id = c.medico_id
      WHERE c.id = $1
        AND c.deleted_at IS NULL
      LIMIT 1
    `,
    [appointmentId]
  );

  return result.rows[0] || null;
}

async function getPatientProfileByUserId(userId) {
  const result = await query(
    `
      SELECT id
      FROM perfil_paciente
      WHERE usuario_id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

async function listMedicalRecordsForPatient(patientId) {
  const result = await query(
    `
      SELECT
        hc.id,
        hc.paciente_id AS "patientId",
        hc.medico_creador_id AS "createdByDoctorId",
        hc.resumen_general AS summary,
        hc.alergias AS allergies,
        hc.condiciones_cronicas AS "chronicConditions",
        hc.medicamentos_actuales AS "currentMedications",
        hc.estado AS status,
        COALESCE(json_agg(
          json_build_object(
            'id', nc.id,
            'appointmentId', nc.cita_id,
            'doctorId', nc.medico_id,
            'subjective', nc.subjetivo,
            'objective', nc.objetivo,
            'assessment', nc.analisis,
            'plan', nc.plan,
            'createdAt', nc.created_at
          )
        ) FILTER (WHERE nc.id IS NOT NULL), '[]') AS notes
      FROM historia_clinica hc
      LEFT JOIN nota_clinica nc ON nc.historia_clinica_id = hc.id AND nc.deleted_at IS NULL
      WHERE hc.paciente_id = $1
        AND hc.deleted_at IS NULL
      GROUP BY hc.id
      ORDER BY hc.created_at DESC
    `,
    [patientId]
  );

  return result.rows;
}

async function createClinicalNote(payload) {
  return withTransaction(async (client) => {
    let recordResult = await client.query(
      `
        SELECT id
        FROM historia_clinica
        WHERE paciente_id = $1
          AND estado = 'activa'
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [payload.patientId]
    );

    let recordId = recordResult.rows[0]?.id;

    if (!recordId) {
      const newRecord = await client.query(
        `
          INSERT INTO historia_clinica (
            paciente_id,
            medico_creador_id,
            resumen_general,
            alergias,
            condiciones_cronicas,
            medicamentos_actuales,
            estado
          )
          VALUES ($1, $2, $3, $4, $5, $6, 'activa')
          RETURNING id
        `,
        [
          payload.patientId,
          payload.doctorId,
          payload.summary || null,
          payload.allergies || null,
          payload.chronicConditions || null,
          payload.currentMedications || null
        ]
      );

      recordId = newRecord.rows[0].id;
    }

    const noteResult = await client.query(
      `
        INSERT INTO nota_clinica (
          historia_clinica_id,
          cita_id,
          medico_id,
          subjetivo,
          objetivo,
          analisis,
          plan
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          id,
          historia_clinica_id AS "medicalRecordId",
          cita_id AS "appointmentId",
          medico_id AS "doctorId",
          subjetivo AS subjective,
          objetivo AS objective,
          analisis AS assessment,
          plan
        `,
      [
        recordId,
        payload.appointmentId,
        payload.doctorId,
        payload.subjective || null,
        payload.objective || null,
        payload.assessment || null,
        payload.plan || null
      ]
    );

    return noteResult.rows[0];
  });
}

async function createPrescription(payload) {
  return withTransaction(async (client) => {
    const prescriptionResult = await client.query(
      `
        INSERT INTO receta (
          cita_id,
          paciente_id,
          medico_id,
          estado,
          instrucciones_generales
        )
        VALUES ($1, $2, $3, 'emitida', $4)
        RETURNING id, cita_id AS "appointmentId", paciente_id AS "patientId", medico_id AS "doctorId", estado AS status
      `,
      [payload.appointmentId, payload.patientId, payload.doctorId, payload.generalInstructions || null]
    );

    const prescription = prescriptionResult.rows[0];
    const items = [];

    for (const item of payload.items) {
      const itemResult = await client.query(
        `
          INSERT INTO receta_item (
            receta_id,
            medicamento,
            presentacion,
            dosis,
            frecuencia,
            duracion_dias,
            indicaciones
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, medicamento AS medication, dosis AS dose, frecuencia AS frequency
        `,
        [
          prescription.id,
          item.medication,
          item.presentation || null,
          item.dose,
          item.frequency,
          item.durationDays,
          item.instructions || null
        ]
      );

      items.push(itemResult.rows[0]);
    }

    return {
      ...prescription,
      items
    };
  });
}

async function listPrescriptionsForPatient(patientId) {
  const result = await query(
    `
      SELECT
        r.id,
        r.cita_id AS "appointmentId",
        r.paciente_id AS "patientId",
        r.medico_id AS "doctorId",
        r.estado AS status,
        r.instrucciones_generales AS "generalInstructions",
        COALESCE(json_agg(
          json_build_object(
            'id', ri.id,
            'medication', ri.medicamento,
            'presentation', ri.presentacion,
            'dose', ri.dosis,
            'frequency', ri.frecuencia,
            'durationDays', ri.duracion_dias,
            'instructions', ri.indicaciones
          )
        ) FILTER (WHERE ri.id IS NOT NULL), '[]') AS items
      FROM receta r
      LEFT JOIN receta_item ri ON ri.receta_id = r.id AND ri.deleted_at IS NULL
      WHERE r.paciente_id = $1
        AND r.deleted_at IS NULL
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `,
    [patientId]
  );

  return result.rows;
}

module.exports = {
  createClinicalNote,
  createPrescription,
  findAppointmentForClinical,
  getPatientProfileByUserId,
  listMedicalRecordsForPatient,
  listPrescriptionsForPatient
};
