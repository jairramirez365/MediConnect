const { withTransaction } = require('../../database/query');
const { query } = require('../../database/query');
const { ensureVideoConsultationSchema } = require('../video-consultations/videoConsultation.repository');

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

async function createNotification(client, { userId, appointmentId, type, message, scheduledAt, state = 'programada' }) {
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
      VALUES ($1, $2, $3, 'interno', $4, $5, $6)
    `,
    [userId, appointmentId, type, message, state, scheduledAt]
  );
}

async function expirePendingPaymentAppointmentsWithExecutor(executor) {
  const result = await executor.query(
    `
      UPDATE cita
      SET estado = 'expirada_por_no_pago'
      WHERE estado = 'pendiente_pago'
        AND fecha_expiracion_pago IS NOT NULL
        AND fecha_expiracion_pago <= NOW()
        AND deleted_at IS NULL
      RETURNING id
    `
  );

  if (result.rowCount > 0) {
    const appointmentIds = result.rows.map((row) => row.id);

    await executor.query(
      `
        UPDATE pago
        SET estado = 'cancelado', updated_at = NOW()
        WHERE cita_id = ANY($1::uuid[])
          AND estado IN ('pendiente', 'autorizado')
          AND deleted_at IS NULL
      `,
      [appointmentIds]
    );

    await executor.query(
      `
        UPDATE notificacion
        SET estado = 'cancelada', updated_at = NOW()
        WHERE cita_id = ANY($1::uuid[])
          AND estado = 'programada'
          AND deleted_at IS NULL
      `,
      [appointmentIds]
    );
  }

  return result.rowCount;
}

async function expirePendingPaymentAppointments() {
  return expirePendingPaymentAppointmentsWithExecutor({ query });
}

async function hasOverlappingAppointment(client, doctorId, scheduledStartAt, scheduledEndAt) {
  const result = await client.query(
    `
      SELECT 1
      FROM cita
      WHERE medico_id = $1
        AND (
          estado IN ('pendiente_confirmacion', 'confirmada', 'en_curso')
          OR (estado = 'pendiente_pago' AND fecha_expiracion_pago > NOW())
        )
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

async function isFreeFollowUpEligible(client, patientId, doctorId, scheduledStartAt) {
  const result = await client.query(
    `
      SELECT 1
      FROM cita
      WHERE paciente_id = $1
        AND medico_id = $2
        AND estado = 'completada'
        AND deleted_at IS NULL
        AND fecha_hora_inicio_programada >= ($3::timestamptz - INTERVAL '1 month')
        AND fecha_hora_inicio_programada < $3::timestamptz
      LIMIT 1
    `,
    [patientId, doctorId, scheduledStartAt]
  );

  return result.rowCount > 0;
}

async function createAppointment(payload) {
  return withTransaction(async (client) => {
    await expirePendingPaymentAppointmentsWithExecutor(client);

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

    const isFreeFollowUp =
      payload.appointmentType === 'seguimiento'
        ? await isFreeFollowUpEligible(client, payload.patientId, payload.doctorId, payload.scheduledStartAt)
        : false;

    const consultationFee = isFreeFollowUp ? 0 : Number(doctor.valor_consulta || 0);
    const appointmentStatus = consultationFee === 0 ? 'confirmada' : 'pendiente_pago';
    const paymentExpiresAt =
      consultationFee === 0 ? null : new Date(Date.now() + 30 * 60 * 1000);

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
          fecha_expiracion_pago,
          fecha_limite_cancelacion_sin_multa,
          valor_consulta,
          valor_multa_cancelacion
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id, estado, fecha_hora_inicio_programada, fecha_hora_fin_programada, valor_consulta, fecha_expiracion_pago
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
        appointmentStatus,
        Boolean(payload.requiresCommissionAgentInChat),
        paymentExpiresAt,
        payload.cancellationDeadline,
        consultationFee,
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
      await createNotification(client, {
        userId: notification.userId,
        appointmentId: appointment.id,
        type: notification.type,
        message: notification.message,
        scheduledAt: notification.scheduledAt
      });
    }

    if (payload.requiresCommissionAgentInChat && commissionAgent) {
      await createNotification(client, {
        userId: patient.usuario_id,
        appointmentId: appointment.id,
        type: 'solicitud_participacion_comisionista_chat_pendiente',
        message: 'Tu gestor solicito acompanarte en el chat de esta consulta. Podras aceptarlo o rechazarlo antes de iniciar.',
        scheduledAt: new Date(new Date(payload.scheduledStartAt).getTime() - 5 * 60 * 1000)
      });
    }

    return {
      type: 'created',
      appointment: {
        ...appointment,
        isFreeFollowUp,
        requiresPayment: consultationFee > 0
      }
    };
  });
}

async function listAppointments(filters) {
  await expirePendingPaymentAppointments();
  await ensureVideoConsultationSchema();

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
      c.paciente_id AS "patientId",
      c.medico_id AS "doctorId",
      c.estado AS status,
      c.fecha_expiracion_pago AS "paymentExpiresAt",
      c.fecha_hora_inicio_programada AS "scheduledStartAt",
      c.fecha_hora_fin_programada AS "scheduledEndAt",
      c.zona_horaria AS "timeZone",
      c.motivo_consulta AS reason,
      c.tipo_consulta AS "appointmentType",
      c.canal_atencion AS "careChannel",
      c.requiere_comisionista_en_chat AS "requiresCommissionAgentInChat",
      c.valor_consulta AS "consultationFee",
      c.valor_multa_cancelacion AS "cancellationPenalty",
      c.fecha_limite_cancelacion_sin_multa AS "freeCancellationDeadline",
      CONCAT(pp.nombres, ' ', pp.apellidos) AS patient,
      CONCAT(pm.nombres, ' ', pm.apellidos) AS doctor,
      specialties.specialties AS "doctorSpecialties",
      video_session.id AS "videoConsultationId",
      video_session.status AS "videoConsultationStatus",
      video_session."accessStartsAt" AS "videoConsultationAccessStartsAt",
      video_session."accessEndsAt" AS "videoConsultationAccessEndsAt",
      chat_request.status AS "commissionAgentChatRequestStatus",
      chat_request."scheduledAt" AS "commissionAgentChatRequestAt",
      COUNT(*) OVER()::int AS total
    FROM cita c
    INNER JOIN perfil_paciente pp ON pp.id = c.paciente_id
    INNER JOIN perfil_medico pm ON pm.id = c.medico_id
    LEFT JOIN LATERAL (
      SELECT ARRAY_REMOVE(ARRAY_AGG(DISTINCT e.nombre), NULL) AS specialties
      FROM medico_especialidad me
      INNER JOIN especialidad e ON e.id = me.especialidad_id AND e.deleted_at IS NULL
      WHERE me.medico_id = c.medico_id
        AND me.deleted_at IS NULL
    ) specialties ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        vc.id,
        vc.estado AS status,
        vc.fecha_habilitacion_acceso AS "accessStartsAt",
        vc.fecha_expiracion_acceso AS "accessEndsAt"
      FROM video_consulta vc
      WHERE vc.cita_id = c.id
        AND vc.deleted_at IS NULL
      LIMIT 1
    ) video_session ON TRUE
    LEFT JOIN LATERAL (
      SELECT
        CASE
          WHEN n.tipo_notificacion = 'solicitud_participacion_comisionista_chat_aceptada' THEN 'aceptada'
          WHEN n.tipo_notificacion = 'solicitud_participacion_comisionista_chat_rechazada' THEN 'rechazada'
          ELSE 'pendiente_paciente'
        END AS status,
        n.fecha_programada_envio AS "scheduledAt"
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
  await expirePendingPaymentAppointments();

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
        c.fecha_expiracion_pago AS "paymentExpiresAt",
        c.fecha_hora_inicio_programada AS "scheduledStartAt",
        c.fecha_hora_fin_programada AS "scheduledEndAt",
        c.valor_multa_cancelacion AS "cancellationPenalty",
        c.requiere_comisionista_en_chat AS "requiresCommissionAgentInChat"
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

async function findAppointmentDetailById(appointmentId) {
  await expirePendingPaymentAppointments();
  await ensureVideoConsultationSchema();

  const result = await query(
    `
      SELECT
        c.id,
        c.paciente_id AS "patientId",
        c.medico_id AS "doctorId",
        pp.usuario_id AS "patientUserId",
        pm.usuario_id AS "doctorUserId",
        c.comisionista_id AS "commissionAgentId",
        pc.usuario_id AS "commissionAgentUserId",
        c.estado AS status,
        c.fecha_expiracion_pago AS "paymentExpiresAt",
        c.fecha_hora_inicio_programada AS "scheduledStartAt",
        c.fecha_hora_fin_programada AS "scheduledEndAt",
        c.zona_horaria AS "timeZone",
        c.motivo_consulta AS reason,
        c.tipo_consulta AS "appointmentType",
        c.canal_atencion AS "careChannel",
        c.requiere_comisionista_en_chat AS "requiresCommissionAgentInChat",
        c.valor_consulta AS "consultationFee",
        c.valor_multa_cancelacion AS "cancellationPenalty",
        c.fecha_limite_cancelacion_sin_multa AS "freeCancellationDeadline",
        CONCAT(pp.nombres, ' ', pp.apellidos) AS patient,
        CONCAT(pm.nombres, ' ', pm.apellidos) AS doctor,
        specialties.specialties AS "doctorSpecialties",
        video_session.id AS "videoConsultationId",
        video_session.status AS "videoConsultationStatus",
        video_session."accessStartsAt" AS "videoConsultationAccessStartsAt",
        video_session."accessEndsAt" AS "videoConsultationAccessEndsAt",
        chat_request.status AS "commissionAgentChatRequestStatus",
        chat_request."scheduledAt" AS "commissionAgentChatRequestAt",
        note.id AS "clinicalNoteId",
        note.subjetivo AS subjective,
        note.objetivo AS objective,
        note.analisis AS assessment,
        note.plan AS plan,
        note.created_at AS "clinicalNoteCreatedAt",
        prescription.id AS "prescriptionId",
        prescription.estado AS "prescriptionStatus",
        prescription.instrucciones_generales AS "generalInstructions",
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', recipe_item.id,
              'medication', recipe_item.medicamento,
              'presentation', recipe_item.presentacion,
              'dose', recipe_item.dosis,
              'frequency', recipe_item.frecuencia,
              'durationDays', recipe_item.duracion_dias,
              'instructions', recipe_item.indicaciones
            )
          ) FILTER (WHERE recipe_item.id IS NOT NULL),
          '[]'::json
        ) AS "prescriptionItems",
        rating.id AS "ratingId",
        rating.puntaje AS score,
        rating.comentario AS comment,
        rating.estado AS "ratingStatus"
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
          vc.id,
          vc.estado AS status,
          vc.fecha_habilitacion_acceso AS "accessStartsAt",
          vc.fecha_expiracion_acceso AS "accessEndsAt"
        FROM video_consulta vc
        WHERE vc.cita_id = c.id
          AND vc.deleted_at IS NULL
        LIMIT 1
      ) video_session ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          CASE
            WHEN n.tipo_notificacion = 'solicitud_participacion_comisionista_chat_aceptada' THEN 'aceptada'
            WHEN n.tipo_notificacion = 'solicitud_participacion_comisionista_chat_rechazada' THEN 'rechazada'
            ELSE 'pendiente_paciente'
          END AS status,
          n.fecha_programada_envio AS "scheduledAt"
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
      LEFT JOIN nota_clinica note ON note.cita_id = c.id AND note.deleted_at IS NULL
      LEFT JOIN receta prescription ON prescription.cita_id = c.id AND prescription.deleted_at IS NULL
      LEFT JOIN receta_item recipe_item ON recipe_item.receta_id = prescription.id AND recipe_item.deleted_at IS NULL
      LEFT JOIN calificacion_medico rating ON rating.cita_id = c.id AND rating.deleted_at IS NULL
      WHERE c.id = $1
        AND c.deleted_at IS NULL
      GROUP BY
        c.id,
        pp.nombres,
        pp.apellidos,
        pp.usuario_id,
        pm.nombres,
        pm.apellidos,
        pm.usuario_id,
        pc.usuario_id,
        specialties.specialties,
        video_session.id,
        video_session.status,
        video_session."accessStartsAt",
        video_session."accessEndsAt",
        chat_request.status,
        chat_request."scheduledAt",
        note.id,
        prescription.id,
        rating.id
      LIMIT 1
    `,
    [appointmentId]
  );

  return result.rows[0] || null;
}

async function isPatientLinkedToCommissionAgent(commissionAgentId, userId, patientId) {
  const result = await query(
    `
      SELECT 1
      FROM cita c
      LEFT JOIN codigo_referido cr ON cr.id = c.codigo_referido_id AND cr.deleted_at IS NULL
      WHERE c.deleted_at IS NULL
        AND c.paciente_id = $3
        AND (c.comisionista_id = $1 OR cr.usuario_id = $2)
      LIMIT 1
    `,
    [commissionAgentId, userId, patientId]
  );

  return result.rowCount > 0;
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
        valor_multa_cancelacion = COALESCE($8, valor_multa_cancelacion),
        fecha_expiracion_pago = CASE
          WHEN $10::boolean THEN $9
          ELSE fecha_expiracion_pago
        END
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING
        id,
        estado AS status,
        motivo_cancelacion AS "cancellationReason",
        valor_multa_cancelacion AS "cancellationPenalty",
        fecha_expiracion_pago AS "paymentExpiresAt",
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
      payload.cancellationPenalty ?? null,
      payload.paymentExpiresAt ?? null,
      payload.clearPaymentExpiration ?? false
    ]
  );

  return result.rows[0] || null;
}

async function respondCommissionAgentChatRequest(appointment, action) {
  return withTransaction(async (client) => {
    await client.query(
      `
        UPDATE notificacion
        SET estado = 'cancelada'
        WHERE cita_id = $1
          AND deleted_at IS NULL
          AND tipo_notificacion = 'solicitud_participacion_comisionista_chat_pendiente'
          AND estado = 'programada'
      `,
      [appointment.id]
    );

    if (action === 'accept') {
      let chatId = null;
      const existingChat = await client.query(
        `
          SELECT id
          FROM chat_consulta
          WHERE cita_id = $1
            AND deleted_at IS NULL
          LIMIT 1
        `,
        [appointment.id]
      );

      if (existingChat.rowCount > 0) {
        chatId = existingChat.rows[0].id;
      } else {
        const createdChat = await client.query(
          `
            INSERT INTO chat_consulta (cita_id, estado)
            VALUES ($1, 'cerrado')
            RETURNING id
          `,
          [appointment.id]
        );
        chatId = createdChat.rows[0].id;
      }

      await client.query(
        `
          INSERT INTO participante_chat_consulta (
            chat_consulta_id,
            usuario_id,
            rol_participante,
            autorizado_por_paciente
          )
          VALUES ($1, $2, 'comisionista', TRUE)
          ON CONFLICT (chat_consulta_id, usuario_id)
          DO UPDATE SET
            rol_participante = 'comisionista',
            autorizado_por_paciente = TRUE,
            deleted_at = NULL,
            updated_at = NOW()
        `,
        [chatId, appointment.commissionAgentUserId]
      );
    } else {
      await client.query(
        `
          UPDATE participante_chat_consulta
          SET autorizado_por_paciente = FALSE
          WHERE usuario_id = $1
            AND deleted_at IS NULL
            AND chat_consulta_id IN (
              SELECT id
              FROM chat_consulta
              WHERE cita_id = $2
                AND deleted_at IS NULL
            )
        `,
        [appointment.commissionAgentUserId, appointment.id]
      );
    }

    const notificationType =
      action === 'accept'
        ? 'solicitud_participacion_comisionista_chat_aceptada'
        : 'solicitud_participacion_comisionista_chat_rechazada';
    const patientMessage =
      action === 'accept'
        ? 'Aceptaste la participacion del gestor en el chat de esta consulta.'
        : 'Rechazaste la participacion del gestor en el chat de esta consulta.';
    const commissionAgentMessage =
      action === 'accept'
        ? 'El paciente acepto tu participacion en el chat de la consulta.'
        : 'El paciente rechazo tu participacion en el chat de la consulta.';

    await createNotification(client, {
      userId: appointment.patientUserId,
      appointmentId: appointment.id,
      type: notificationType,
      message: patientMessage,
      scheduledAt: new Date(),
      state: 'enviada'
    });

    await createNotification(client, {
      userId: appointment.commissionAgentUserId,
      appointmentId: appointment.id,
      type: notificationType,
      message: commissionAgentMessage,
      scheduledAt: new Date(),
      state: 'enviada'
    });

    return findAppointmentDetailById(appointment.id);
  });
}

async function validateSlotForReschedule(doctorId, appointmentId, scheduledStartAt, scheduledEndAt) {
  return withTransaction(async (client) => {
    await expirePendingPaymentAppointmentsWithExecutor(client);

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
          AND (
            estado IN ('pendiente_confirmacion', 'confirmada', 'en_curso')
            OR (estado = 'pendiente_pago' AND fecha_expiracion_pago > NOW())
          )
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
  expirePendingPaymentAppointments,
  findActorProfile,
  findAppointmentById,
  findAppointmentDetailById,
  isPatientLinkedToCommissionAgent,
  listAppointments,
  respondCommissionAgentChatRequest,
  updateAppointmentBusinessState,
  updateAppointmentStatus,
  validateSlotForReschedule
};
