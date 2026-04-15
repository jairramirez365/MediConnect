const { withTransaction } = require('../../database/query');
const { query } = require('../../database/query');

async function findActorProfile(user) {
  const profileByRole = {
    paciente: {
      table: 'perfil_paciente',
      alias: 'patientProfileId'
    },
    medico: {
      table: 'perfil_medico',
      alias: 'doctorProfileId'
    },
    comisionista: {
      table: 'perfil_comisionista',
      alias: 'commissionAgentProfileId'
    },
    administrador: {
      table: 'perfil_administrador',
      alias: 'adminProfileId'
    }
  };

  const config = profileByRole[user.role];

  if (!config) {
    return null;
  }

  const result = await query(
    `
      SELECT id AS "${config.alias}", usuario_id AS "userId"
      FROM ${config.table}
      WHERE usuario_id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [user.sub]
  );

  return result.rows[0] || null;
}

async function findDoctorById(client, doctorId) {
  const result = await client.query(
    `
      SELECT id, usuario_id, valor_consulta, estado_validacion
      FROM perfil_medico
      WHERE id = $1 AND deleted_at IS NULL
    `,
    [doctorId]
  );

  return result.rows[0] || null;
}

async function findPatientById(client, patientId) {
  const result = await client.query(
    `
      SELECT id, usuario_id, autorizo_participacion_comisionista_chat
      FROM perfil_paciente
      WHERE id = $1 AND deleted_at IS NULL
    `,
    [patientId]
  );

  return result.rows[0] || null;
}

async function findCommissionAgentById(client, commissionAgentId) {
  const result = await client.query(
    `
      SELECT id, usuario_id
      FROM perfil_comisionista
      WHERE id = $1 AND deleted_at IS NULL AND estado = 'activo'
    `,
    [commissionAgentId]
  );

  return result.rows[0] || null;
}

async function findReferralCodeById(client, referralCodeId) {
  const result = await client.query(
    `
      SELECT id, usuario_id, tipo_generador, esta_activo
      FROM codigo_referido
      WHERE id = $1 AND deleted_at IS NULL
    `,
    [referralCodeId]
  );

  return result.rows[0] || null;
}

async function hasOverlappingAppointment(client, doctorId, scheduledStartAt, scheduledEndAt) {
  const result = await client.query(
    `
      SELECT 1
      FROM cita
      WHERE medico_id = $1
        AND estado IN ('pendiente_confirmacion', 'confirmada', 'en_curso')
        AND deleted_at IS NULL
        AND tstzrange(fecha_hora_inicio_programada, fecha_hora_fin_programada, '[)')
            && tstzrange($2::timestamptz, $3::timestamptz, '[)')
      LIMIT 1
    `,
    [doctorId, scheduledStartAt, scheduledEndAt]
  );

  return result.rowCount > 0;
}

async function findMatchingAvailability(client, doctorId, scheduledStartAt, scheduledEndAt) {
  const result = await client.query(
    `
      SELECT id
      FROM disponibilidad_medico
      WHERE medico_id = $1
        AND esta_activa = TRUE
        AND deleted_at IS NULL
        AND dia_semana = EXTRACT(DOW FROM $2::timestamptz AT TIME ZONE zona_horaria)
        AND (($2::timestamptz AT TIME ZONE zona_horaria)::date >= vigente_desde)
        AND (vigente_hasta IS NULL OR ($2::timestamptz AT TIME ZONE zona_horaria)::date <= vigente_hasta)
        AND (($2::timestamptz AT TIME ZONE zona_horaria)::time >= hora_inicio)
        AND (($3::timestamptz AT TIME ZONE zona_horaria)::time <= hora_fin)
        AND EXTRACT(EPOCH FROM ($3::timestamptz - $2::timestamptz)) / 60 = duracion_bloque_minutos
        AND MOD((EXTRACT(EPOCH FROM (((($2::timestamptz AT TIME ZONE zona_horaria)::time) - hora_inicio))) / 60)::int, duracion_bloque_minutos) = 0
      LIMIT 1
    `,
    [doctorId, scheduledStartAt, scheduledEndAt]
  );

  return result.rows[0] || null;
}

async function createAppointment(payload) {
  return withTransaction(async (client) => {
    const doctor = await findDoctorById(client, payload.doctorId);
    const patient = await findPatientById(client, payload.patientId);

    let commissionAgent = null;
    let referralCode = null;

    if (!doctor) return { type: 'missing_doctor' };
    if (!patient) return { type: 'missing_patient' };

    if (payload.commissionAgentId) {
      commissionAgent = await findCommissionAgentById(client, payload.commissionAgentId);
      if (!commissionAgent) return { type: 'missing_commission_agent' };
    }

    if (payload.requiresCommissionAgentInChat && !payload.commissionAgentId) {
      return { type: 'commission_agent_required' };
    }

    if (payload.requiresCommissionAgentInChat && !patient.autorizo_participacion_comisionista_chat) {
      return { type: 'patient_not_authorized_for_agent_chat' };
    }

    if (payload.referralCodeId) {
      referralCode = await findReferralCodeById(client, payload.referralCodeId);
      if (!referralCode || !referralCode.esta_activo) return { type: 'invalid_referral_code' };
    }

    const overlapping = await hasOverlappingAppointment(
      client,
      payload.doctorId,
      payload.scheduledStartAt,
      payload.scheduledEndAt
    );

    if (overlapping) return { type: 'doctor_overlap' };
    if (doctor.estado_validacion !== 'activo') return { type: 'doctor_not_active' };

    const availability = await findMatchingAvailability(
      client,
      payload.doctorId,
      payload.scheduledStartAt,
      payload.scheduledEndAt
    );

    if (!availability) return { type: 'doctor_unavailable' };

    const result = await client.query(
      `
        INSERT INTO cita (
          paciente_id,
          medico_id,
          comisionista_id,
          codigo_referido_id,
          fecha_hora_inicio_programada,
          fecha_hora_fin_programada,
          zona_horaria,
          motivo_consulta,
          tipo_consulta,
          canal_atencion,
          estado,
          requiere_comisionista_en_chat,
          fecha_limite_cancelacion_sin_multa,
          valor_consulta,
          valor_multa_cancelacion
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pendiente_confirmacion', $11, $12, $13, $14)
        RETURNING id, estado, fecha_hora_inicio_programada, fecha_hora_fin_programada, valor_consulta
      `,
      [
        payload.patientId,
        payload.doctorId,
        payload.commissionAgentId || null,
        payload.referralCodeId || null,
        payload.scheduledStartAt,
        payload.scheduledEndAt,
        payload.timeZone,
        payload.reason,
        payload.appointmentType,
        payload.careChannel,
        Boolean(payload.requiresCommissionAgentInChat),
        payload.cancellationDeadline,
        doctor.valor_consulta,
        payload.cancellationPenalty
      ]
    );

    const appointment = result.rows[0];

    const notifications = [
      {
        userId: patient.usuario_id,
        type: 'recordatorio_10_minutos',
        message: 'Tu consulta inicia en 10 minutos.',
        scheduledAt: new Date(new Date(payload.scheduledStartAt).getTime() - 10 * 60 * 1000)
      },
      {
        userId: doctor.usuario_id,
        type: 'recordatorio_10_minutos',
        message: 'La consulta con tu paciente inicia en 10 minutos.',
        scheduledAt: new Date(new Date(payload.scheduledStartAt).getTime() - 10 * 60 * 1000)
      },
      {
        userId: patient.usuario_id,
        type: 'recordatorio_5_minutos',
        message: 'Tu consulta inicia en 5 minutos.',
        scheduledAt: new Date(new Date(payload.scheduledStartAt).getTime() - 5 * 60 * 1000)
      },
      {
        userId: doctor.usuario_id,
        type: 'recordatorio_5_minutos',
        message: 'La consulta con tu paciente inicia en 5 minutos.',
        scheduledAt: new Date(new Date(payload.scheduledStartAt).getTime() - 5 * 60 * 1000)
      }
    ];

    for (const notification of notifications) {
      await client.query(
        `
          INSERT INTO notificacion (
            usuario_id,
            cita_id,
            tipo_notificacion,
            canal,
            mensaje,
            estado,
            fecha_programada_envio
          )
          VALUES ($1, $2, $3, 'interno', $4, 'programada', $5)
        `,
        [notification.userId, appointment.id, notification.type, notification.message, notification.scheduledAt]
      );
    }

    return {
      type: 'created',
      appointment
    };
  });
}

async function listAppointments(filters) {
  const values = [];
  const conditions = ['c.deleted_at IS NULL'];

  if (filters.status) {
    values.push(filters.status);
    conditions.push(`c.estado = $${values.length}`);
  }

  if (filters.doctorId) {
    values.push(filters.doctorId);
    conditions.push(`c.medico_id = $${values.length}`);
  }

  if (filters.patientId) {
    values.push(filters.patientId);
    conditions.push(`c.paciente_id = $${values.length}`);
  }

  if (filters.commissionAgentId) {
    values.push(filters.commissionAgentId);
    conditions.push(`c.comisionista_id = $${values.length}`);
  }

  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  values.push(limit);
  const limitParam = values.length;
  values.push(offset);
  const offsetParam = values.length;

  const sql = `
    SELECT
      c.id,
      c.estado AS status,
      c.fecha_hora_inicio_programada AS "scheduledStartAt",
      c.fecha_hora_fin_programada AS "scheduledEndAt",
      c.zona_horaria AS "timeZone",
      c.motivo_consulta AS reason,
      c.tipo_consulta AS "appointmentType",
      c.canal_atencion AS "careChannel",
      c.valor_consulta AS "consultationFee",
      c.valor_multa_cancelacion AS "cancellationPenalty",
      c.fecha_limite_cancelacion_sin_multa AS "freeCancellationDeadline",
      CONCAT(pp.nombres, ' ', pp.apellidos) AS patient,
      CONCAT(pm.nombres, ' ', pm.apellidos) AS doctor,
      COUNT(*) OVER()::int AS total
    FROM cita c
    INNER JOIN perfil_paciente pp ON pp.id = c.paciente_id
    INNER JOIN perfil_medico pm ON pm.id = c.medico_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY c.fecha_hora_inicio_programada DESC
    LIMIT $${limitParam}
    OFFSET $${offsetParam}
  `;

  const result = await query(sql, values);
  return {
    rows: result.rows.map(({ total, ...row }) => row),
    total: result.rows[0]?.total || 0
  };
}

async function updateAppointmentStatus(appointmentId, status, cancellationReason, cancelledByUserId) {
  const result = await query(
    `
      UPDATE cita
      SET
        estado = $2,
        motivo_cancelacion = $3,
        cancelada_por_usuario_id = $4
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING id, estado AS status, motivo_cancelacion AS "cancellationReason"
    `,
    [appointmentId, status, cancellationReason || null, cancelledByUserId || null]
  );

  return result.rows[0] || null;
}

async function findAppointmentById(appointmentId) {
  const result = await query(
    `
      SELECT
        c.id,
        c.paciente_id AS "patientId",
        pp.usuario_id AS "patientUserId",
        c.medico_id AS "doctorId",
        pm.usuario_id AS "doctorUserId",
        c.comisionista_id AS "commissionAgentId",
        pc.usuario_id AS "commissionAgentUserId",
        c.estado AS status,
        c.fecha_hora_inicio_programada AS "scheduledStartAt",
        c.fecha_hora_fin_programada AS "scheduledEndAt",
        c.valor_multa_cancelacion AS "cancellationPenalty"
      FROM cita c
      INNER JOIN perfil_paciente pp ON pp.id = c.paciente_id
      INNER JOIN perfil_medico pm ON pm.id = c.medico_id
      LEFT JOIN perfil_comisionista pc ON pc.id = c.comisionista_id
      WHERE c.id = $1
        AND c.deleted_at IS NULL
      LIMIT 1
    `,
    [appointmentId]
  );

  return result.rows[0] || null;
}

async function updateAppointmentBusinessState(appointmentId, payload) {
  const result = await query(
    `
      UPDATE cita
      SET
        estado = $2,
        motivo_cancelacion = COALESCE($3, motivo_cancelacion),
        cancelada_por_usuario_id = COALESCE($4, cancelada_por_usuario_id),
        fecha_hora_inicio_programada = COALESCE($5, fecha_hora_inicio_programada),
        fecha_hora_fin_programada = COALESCE($6, fecha_hora_fin_programada),
        fecha_limite_cancelacion_sin_multa = COALESCE($7, fecha_limite_cancelacion_sin_multa),
        valor_multa_cancelacion = COALESCE($8, valor_multa_cancelacion)
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING
        id,
        estado AS status,
        motivo_cancelacion AS "cancellationReason",
        valor_multa_cancelacion AS "cancellationPenalty",
        fecha_hora_inicio_programada AS "scheduledStartAt",
        fecha_hora_fin_programada AS "scheduledEndAt"
    `,
    [
      appointmentId,
      payload.status,
      payload.cancellationReason || null,
      payload.cancelledByUserId || null,
      payload.scheduledStartAt || null,
      payload.scheduledEndAt || null,
      payload.freeCancellationDeadline || null,
      payload.cancellationPenalty ?? null
    ]
  );

  return result.rows[0] || null;
}

async function validateSlotForReschedule(doctorId, appointmentId, scheduledStartAt, scheduledEndAt) {
  return withTransaction(async (client) => {
    const availability = await findMatchingAvailability(client, doctorId, scheduledStartAt, scheduledEndAt);

    if (!availability) {
      return { type: 'doctor_unavailable' };
    }

    const result = await client.query(
      `
        SELECT 1
        FROM cita
        WHERE medico_id = $1
          AND id <> $2
          AND estado IN ('pendiente_confirmacion', 'confirmada', 'en_curso')
          AND deleted_at IS NULL
          AND tstzrange(fecha_hora_inicio_programada, fecha_hora_fin_programada, '[)')
              && tstzrange($3::timestamptz, $4::timestamptz, '[)')
        LIMIT 1
      `,
      [doctorId, appointmentId, scheduledStartAt, scheduledEndAt]
    );

    if (result.rowCount > 0) {
      return { type: 'doctor_overlap' };
    }

    return { type: 'valid' };
  });
}

module.exports = {
  createAppointment,
  findActorProfile,
  findAppointmentById,
  listAppointments,
  updateAppointmentBusinessState,
  updateAppointmentStatus,
  validateSlotForReschedule
};
