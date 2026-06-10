const { query, withTransaction } = require('../../database/query');

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

async function findAppointmentForPayment(appointmentId) {
  const result = await query(
    `
      SELECT
        c.id,
        c.paciente_id AS "patientId",
        pp.usuario_id AS "patientUserId",
        CONCAT(pp.nombres, ' ', pp.apellidos) AS patient,
        c.medico_id AS "doctorId",
        pm.usuario_id AS "doctorUserId",
        CONCAT(pm.nombres, ' ', pm.apellidos) AS doctor,
        c.comisionista_id AS "commissionAgentId",
        pc.usuario_id AS "commissionAgentUserId",
        c.estado AS status,
        c.valor_consulta AS amount,
        c.codigo_referido_id AS "referralCodeId",
        cr.usuario_id AS "referrerUserId",
        cr.tipo_generador AS "referrerType",
        cr.codigo AS "referralCode",
        c.fecha_hora_inicio_programada AS "scheduledStartAt",
        c.tipo_consulta AS "appointmentType",
        c.canal_atencion AS "careChannel"
      FROM cita c
      INNER JOIN perfil_paciente pp ON pp.id = c.paciente_id
      INNER JOIN perfil_medico pm ON pm.id = c.medico_id
      LEFT JOIN perfil_comisionista pc ON pc.id = c.comisionista_id
      LEFT JOIN codigo_referido cr ON cr.id = c.codigo_referido_id
      WHERE c.id = $1
        AND c.deleted_at IS NULL
      LIMIT 1
    `,
    [appointmentId]
  );

  return result.rows[0] || null;
}

async function findPaymentByIdWithExecutor(executor, paymentId) {
  const result = await executor.query(
    `
      SELECT
        p.id,
        p.cita_id AS "appointmentId",
        p.paciente_id AS "patientId",
        pp.usuario_id AS "patientUserId",
        CONCAT(pp.nombres, ' ', pp.apellidos) AS patient,
        p.medico_id AS "doctorId",
        pm.usuario_id AS "doctorUserId",
        CONCAT(pm.nombres, ' ', pm.apellidos) AS doctor,
        c.comisionista_id AS "commissionAgentId",
        pc.usuario_id AS "commissionAgentUserId",
        p.monto AS amount,
        p.moneda AS currency,
        p.metodo_pago AS "paymentMethod",
        p.referencia_pasarela AS "providerReference",
        p.estado AS status,
        p.fecha_pago AS "paidAt",
        p.created_at AS "createdAt",
        c.estado AS "appointmentStatus",
        c.fecha_hora_inicio_programada AS "scheduledStartAt",
        c.codigo_referido_id AS "referralCodeId",
        cr.usuario_id AS "referrerUserId",
        cr.tipo_generador AS "referrerType",
        cr.codigo AS "referralCode"
      FROM pago p
      INNER JOIN cita c ON c.id = p.cita_id
      INNER JOIN perfil_paciente pp ON pp.id = p.paciente_id
      INNER JOIN perfil_medico pm ON pm.id = p.medico_id
      LEFT JOIN perfil_comisionista pc ON pc.id = c.comisionista_id
      LEFT JOIN codigo_referido cr ON cr.id = c.codigo_referido_id
      WHERE p.id = $1
        AND p.deleted_at IS NULL
      LIMIT 1
    `,
    [paymentId]
  );

  return result.rows[0] || null;
}

async function findPaymentById(paymentId) {
  return findPaymentByIdWithExecutor({ query }, paymentId);
}

async function getUserBalance(userId) {
  const result = await query(
    `
      SELECT saldo_disponible AS "availableBalance", saldo_retenido AS "heldBalance", moneda AS currency
      FROM saldo_usuario
      WHERE usuario_id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || { availableBalance: 0, heldBalance: 0, currency: 'COP' };
}

async function getPaymentScopeAggregates(user, context) {
  const values = [];
  const conditions = ['p.deleted_at IS NULL', 'c.deleted_at IS NULL'];

  if (user.role === 'paciente') {
    values.push(user.sub);
    conditions.push(`pp.usuario_id = $${values.length}`);
  }

  if (user.role === 'medico') {
    values.push(user.sub);
    conditions.push(`pm.usuario_id = $${values.length}`);
  }

  if (user.role === 'comisionista') {
    values.push(context?.commissionAgentProfileId || null);
    const profileParam = values.length;
    values.push(user.sub);
    const userParam = values.length;
    conditions.push(`(c.comisionista_id = $${profileParam} OR cr.usuario_id = $${userParam} OR cm.usuario_beneficiario_id = $${userParam})`);
  }

  const result = await query(
    `
      SELECT
        COUNT(DISTINCT p.id)::int AS "totalTransactions",
        COUNT(DISTINCT p.id) FILTER (WHERE p.estado = 'pagado')::int AS "paidTransactions",
        COUNT(DISTINCT p.id) FILTER (WHERE p.estado IN ('pendiente', 'autorizado'))::int AS "pendingTransactions",
        COUNT(DISTINCT p.id) FILTER (WHERE p.metodo_pago = 'pse')::int AS "pseTransactions",
        COALESCE(SUM(p.monto) FILTER (WHERE p.estado = 'pagado'), 0) AS "paidAmount",
        COALESCE(SUM(p.monto) FILTER (WHERE p.estado IN ('pendiente', 'autorizado')), 0) AS "pendingAmount",
        COALESCE(SUM(p.monto) FILTER (WHERE p.estado = 'reembolsado'), 0) AS "refundedAmount",
        COALESCE(SUM(cm.monto_comision) FILTER (WHERE cm.usuario_beneficiario_id = $${values.push(user.sub)} AND cm.estado = 'liquidada'), 0) AS "liquidatedCommissionsAmount",
        COALESCE(SUM(cm.monto_comision) FILTER (WHERE cm.usuario_beneficiario_id = $${values.length} AND cm.estado IN ('calculada', 'pendiente_liquidacion')), 0) AS "pendingCommissionsAmount"
      FROM pago p
      INNER JOIN cita c ON c.id = p.cita_id
      INNER JOIN perfil_paciente pp ON pp.id = c.paciente_id
      INNER JOIN perfil_medico pm ON pm.id = c.medico_id
      LEFT JOIN codigo_referido cr ON cr.id = c.codigo_referido_id
      LEFT JOIN comision cm ON cm.pago_id = p.id AND cm.deleted_at IS NULL
      WHERE ${conditions.join(' AND ')}
    `,
    values
  );

  return result.rows[0];
}

async function getPatientPayableAppointments(userId) {
  const result = await query(
    `
      SELECT
        c.id,
        c.fecha_hora_inicio_programada AS "scheduledStartAt",
        c.fecha_hora_fin_programada AS "scheduledEndAt",
        c.tipo_consulta AS "appointmentType",
        c.canal_atencion AS "careChannel",
        c.estado AS status,
        c.fecha_expiracion_pago AS "paymentExpiresAt",
        c.valor_consulta AS amount,
        CONCAT(pm.nombres, ' ', pm.apellidos) AS doctor,
        COALESCE(pay.id, NULL) AS "paymentId",
        COALESCE(pay.estado, 'sin_pago') AS "paymentStatus",
        COALESCE(pay.metodo_pago, 'pse') AS "paymentMethod"
      FROM cita c
      INNER JOIN perfil_paciente pp ON pp.id = c.paciente_id
      INNER JOIN perfil_medico pm ON pm.id = c.medico_id
      LEFT JOIN LATERAL (
        SELECT id, estado, metodo_pago
        FROM pago
        WHERE cita_id = c.id
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      ) pay ON TRUE
      WHERE pp.usuario_id = $1
        AND c.deleted_at IS NULL
        AND c.estado = 'pendiente_pago'
        AND (c.fecha_expiracion_pago IS NULL OR c.fecha_expiracion_pago > NOW())
        AND (pay.id IS NULL OR pay.estado IN ('pendiente', 'autorizado', 'fallido', 'cancelado', 'reembolsado'))
      ORDER BY c.fecha_hora_inicio_programada ASC
    `,
    [userId]
  );

  return result.rows;
}

async function getDoctorPendingCollectionAmount(userId) {
  const result = await query(
    `
      SELECT COALESCE(SUM(c.valor_consulta), 0) AS amount
      FROM cita c
      INNER JOIN perfil_medico pm ON pm.id = c.medico_id
      LEFT JOIN LATERAL (
        SELECT estado
        FROM pago
        WHERE cita_id = c.id
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      ) pay ON TRUE
      WHERE pm.usuario_id = $1
        AND c.deleted_at IS NULL
        AND c.estado = 'pendiente_pago'
        AND (c.fecha_expiracion_pago IS NULL OR c.fecha_expiracion_pago > NOW())
        AND (pay.estado IS NULL OR pay.estado IN ('pendiente', 'autorizado', 'fallido', 'cancelado', 'reembolsado'))
    `,
    [userId]
  );

  return Number(result.rows[0]?.amount || 0);
}

async function listPayments({ user, context, limit, offset, status, method, search }) {
  const values = [];
  const conditions = ['p.deleted_at IS NULL', 'c.deleted_at IS NULL'];

  if (user.role === 'paciente') {
    values.push(user.sub);
    conditions.push(`pp.usuario_id = $${values.length}`);
  }

  if (user.role === 'medico') {
    values.push(user.sub);
    conditions.push(`pm.usuario_id = $${values.length}`);
  }

  if (user.role === 'comisionista') {
    values.push(context?.commissionAgentProfileId || null);
    const profileParam = values.length;
    values.push(user.sub);
    const userParam = values.length;
    conditions.push(`(c.comisionista_id = $${profileParam} OR cr.usuario_id = $${userParam} OR commission."beneficiaryUserId" = $${userParam})`);
  }

  if (status) {
    values.push(status);
    conditions.push(`p.estado = $${values.length}`);
  }

  if (method) {
    values.push(method);
    conditions.push(`p.metodo_pago = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(
      CONCAT(pp.nombres, ' ', pp.apellidos) ILIKE $${values.length}
      OR CONCAT(pm.nombres, ' ', pm.apellidos) ILIKE $${values.length}
      OR COALESCE(p.referencia_pasarela, '') ILIKE $${values.length}
      OR COALESCE(cr.codigo, '') ILIKE $${values.length}
    )`);
  }

  values.push(limit);
  const limitParam = values.length;
  values.push(offset);
  const offsetParam = values.length;

  const result = await query(
    `
      SELECT
        p.id,
        p.cita_id AS "appointmentId",
        p.monto AS amount,
        p.moneda AS currency,
        p.metodo_pago AS "paymentMethod",
        p.referencia_pasarela AS "providerReference",
        p.estado AS status,
        p.fecha_pago AS "paidAt",
        p.created_at AS "createdAt",
        c.estado AS "appointmentStatus",
        c.fecha_hora_inicio_programada AS "scheduledStartAt",
        c.tipo_consulta AS "appointmentType",
        c.canal_atencion AS "careChannel",
        CONCAT(pp.nombres, ' ', pp.apellidos) AS patient,
        CONCAT(pm.nombres, ' ', pm.apellidos) AS doctor,
        COALESCE(cr.codigo, NULL) AS "referralCode",
        commission."commissionAmount",
        commission."commissionStatus",
        commission."beneficiaryUserId",
        COUNT(*) OVER()::int AS total
      FROM pago p
      INNER JOIN cita c ON c.id = p.cita_id
      INNER JOIN perfil_paciente pp ON pp.id = c.paciente_id
      INNER JOIN perfil_medico pm ON pm.id = c.medico_id
      LEFT JOIN codigo_referido cr ON cr.id = c.codigo_referido_id
      LEFT JOIN LATERAL (
        SELECT
          cm.id,
          cm.monto_comision AS "commissionAmount",
          cm.estado AS "commissionStatus",
          cm.usuario_beneficiario_id AS "beneficiaryUserId"
        FROM comision cm
        WHERE cm.pago_id = p.id
          AND cm.deleted_at IS NULL
        ORDER BY cm.created_at DESC
        LIMIT 1
      ) commission ON TRUE
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.created_at DESC
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

async function createOrUpdatePendingPayment(payload) {
  return withTransaction(async (client) => {
    const existingPayment = await client.query(
      `
        SELECT id, estado AS status, referencia_pasarela AS "providerReference"
        FROM pago
        WHERE cita_id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [payload.appointmentId]
    );

    if (existingPayment.rows[0]?.status === 'pagado') {
      const payment = await findPaymentByIdWithExecutor(client, existingPayment.rows[0].id);
      return {
        payment,
        alreadyPaid: true
      };
    }

    let payment;

    if (existingPayment.rows[0]) {
      const paymentResult = await client.query(
        `
          UPDATE pago
          SET
            estado = 'pendiente',
            fecha_pago = NULL,
            metodo_pago = $2,
            referencia_pasarela = $3,
            updated_at = NOW()
          WHERE id = $1
          RETURNING id
        `,
        [existingPayment.rows[0].id, payload.paymentMethod, payload.providerReference]
      );

      payment = await findPaymentByIdWithExecutor(client, paymentResult.rows[0].id);
    } else {
      const paymentResult = await client.query(
        `
          INSERT INTO pago (
            cita_id,
            paciente_id,
            medico_id,
            monto,
            moneda,
            metodo_pago,
            referencia_pasarela,
            estado
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente')
          RETURNING id
        `,
        [
          payload.appointmentId,
          payload.patientId,
          payload.doctorId,
          payload.amount,
          payload.currency,
          payload.paymentMethod,
          payload.providerReference
        ]
      );

      payment = await findPaymentByIdWithExecutor(client, paymentResult.rows[0].id);
    }

    return {
      payment,
      alreadyPaid: false
    };
  });
}

async function ensureCommissionAndBalance(client, paymentContext) {
  if (!paymentContext.referralCodeId || !paymentContext.referrerUserId) {
    return {
      commission: null,
      balanceMovement: null
    };
  }

  const existingCommission = await client.query(
    `
      SELECT id, monto_comision AS "commissionAmount", estado AS status
      FROM comision
      WHERE pago_id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [paymentContext.paymentId]
  );

  if (existingCommission.rowCount > 0) {
    return {
      commission: existingCommission.rows[0],
      balanceMovement: null
    };
  }

  const percentage = paymentContext.referrerType === 'comisionista' ? 12.5 : 5;
  const commissionAmount = Number(paymentContext.amount) * (percentage / 100);

  const commissionResult = await client.query(
    `
      INSERT INTO comision (
        cita_id,
        pago_id,
        usuario_beneficiario_id,
        tipo_beneficiario,
        codigo_referido_id,
        monto_base,
        porcentaje_comision,
        monto_comision,
        estado,
        fecha_calculo,
        fecha_liquidacion
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'liquidada', NOW(), NOW())
      RETURNING id, monto_comision AS "commissionAmount", estado AS status
    `,
    [
      paymentContext.appointmentId,
      paymentContext.paymentId,
      paymentContext.referrerUserId,
      paymentContext.referrerType,
      paymentContext.referralCodeId,
      paymentContext.amount,
      percentage,
      commissionAmount
    ]
  );

  const commission = commissionResult.rows[0];

  const balanceResult = await client.query(
    `
      UPDATE saldo_usuario
      SET saldo_disponible = saldo_disponible + $2, fecha_actualizacion = NOW()
      WHERE usuario_id = $1
      RETURNING id
    `,
    [paymentContext.referrerUserId, commissionAmount]
  );

  const movementResult = await client.query(
    `
      INSERT INTO movimiento_saldo (
        saldo_usuario_id,
        usuario_id,
        tipo_movimiento,
        origen_movimiento,
        origen_id,
        monto,
        descripcion,
        estado
      )
      VALUES ($1, $2, 'credito', 'comision', $3, $4, 'Comision por pago exitoso de cita', 'aplicado')
      RETURNING id, monto AS amount, estado AS status
    `,
    [balanceResult.rows[0].id, paymentContext.referrerUserId, commission.id, commissionAmount]
  );

  return {
    commission,
    balanceMovement: movementResult.rows[0]
  };
}

async function settlePaymentById(paymentId, payload) {
  return withTransaction(async (client) => {
    const paymentResult = await client.query(
      `
        SELECT
          p.id,
          p.cita_id AS "appointmentId",
          p.monto AS amount,
          p.moneda AS currency,
          p.estado AS status,
          c.codigo_referido_id AS "referralCodeId",
          cr.usuario_id AS "referrerUserId",
          cr.tipo_generador AS "referrerType"
        FROM pago p
        INNER JOIN cita c ON c.id = p.cita_id
        LEFT JOIN codigo_referido cr ON cr.id = c.codigo_referido_id
        WHERE p.id = $1
          AND p.deleted_at IS NULL
        LIMIT 1
      `,
      [paymentId]
    );

    const paymentContext = paymentResult.rows[0];

    if (!paymentContext) {
      return {
        type: 'missing_payment'
      };
    }

    if (paymentContext.status === 'pagado') {
      const currentPayment = await findPaymentByIdWithExecutor(client, paymentId);
      return {
        payment: currentPayment,
        commission: null,
        balanceMovement: null,
        alreadyPaid: true
      };
    }

    await client.query(
      `
        UPDATE pago
        SET
          estado = 'pagado',
          fecha_pago = NOW(),
          metodo_pago = COALESCE($2, metodo_pago),
          referencia_pasarela = COALESCE($3, referencia_pasarela),
          updated_at = NOW()
        WHERE id = $1
      `,
      [paymentId, payload.paymentMethod || null, payload.providerReference || null]
    );

    await client.query(
      `
        UPDATE cita
        SET
          estado = 'confirmada',
          fecha_expiracion_pago = NULL,
          updated_at = NOW()
        WHERE id = $1
      `,
      [paymentContext.appointmentId]
    );

    const currentPayment = await findPaymentByIdWithExecutor(client, paymentId);
    const { commission, balanceMovement } = await ensureCommissionAndBalance(client, {
      ...paymentContext,
      paymentId
    });

    return {
      payment: currentPayment,
      commission,
      balanceMovement,
      alreadyPaid: false
    };
  });
}

async function createDummyPayment(payload) {
  const checkout = await createOrUpdatePendingPayment({
    ...payload,
    paymentMethod: payload.paymentMethod || 'dummy'
  });

  if (checkout.alreadyPaid) {
    return {
      payment: checkout.payment,
      commission: null,
      balanceMovement: null,
      alreadyPaid: true
    };
  }

  return settlePaymentById(checkout.payment.id, {
    paymentMethod: payload.paymentMethod || 'dummy',
    providerReference: payload.providerReference
  });
}

module.exports = {
  createDummyPayment,
  createOrUpdatePendingPayment,
  findActorProfile,
  findAppointmentForPayment,
  findPaymentById,
  getDoctorPendingCollectionAmount,
  getPatientPayableAppointments,
  getPaymentScopeAggregates,
  getUserBalance,
  listPayments,
  settlePaymentById
};
