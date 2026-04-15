const { query, withTransaction } = require('../../database/query');

async function findAppointmentForPayment(appointmentId) {
  const result = await query(
    `
      SELECT
        c.id,
        c.paciente_id AS "patientId",
        pp.usuario_id AS "patientUserId",
        c.medico_id AS "doctorId",
        c.estado AS status,
        c.valor_consulta AS amount,
        c.codigo_referido_id AS "referralCodeId",
        cr.usuario_id AS "referrerUserId",
        cr.tipo_generador AS "referrerType"
      FROM cita c
      INNER JOIN perfil_paciente pp ON pp.id = c.paciente_id
      LEFT JOIN codigo_referido cr ON cr.id = c.codigo_referido_id
      WHERE c.id = $1
        AND c.deleted_at IS NULL
      LIMIT 1
    `,
    [appointmentId]
  );

  return result.rows[0] || null;
}

async function createDummyPayment(payload) {
  return withTransaction(async (client) => {
    const existingPayment = await client.query(
      `
        SELECT id, estado AS status
        FROM pago
        WHERE cita_id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [payload.appointmentId]
    );

    if (existingPayment.rows[0]?.status === 'pagado') {
      return {
        payment: existingPayment.rows[0],
        commission: null,
        balanceMovement: null,
        alreadyPaid: true
      };
    }

    let payment;

    if (existingPayment.rows[0]) {
      const paymentResult = await client.query(
        `
          UPDATE pago
          SET estado = 'pagado', fecha_pago = NOW(), metodo_pago = $2, referencia_pasarela = $3
          WHERE id = $1
          RETURNING id, cita_id AS "appointmentId", monto AS amount, moneda AS currency, estado AS status
        `,
        [existingPayment.rows[0].id, payload.paymentMethod, payload.providerReference]
      );
      payment = paymentResult.rows[0];
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
            estado,
            fecha_pago
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'pagado', NOW())
          RETURNING id, cita_id AS "appointmentId", monto AS amount, moneda AS currency, estado AS status
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
      payment = paymentResult.rows[0];
    }

    let commission = null;
    let balanceMovement = null;

    if (payload.referralCodeId && payload.referrerUserId) {
      const percentage = payload.referrerType === 'comisionista' ? 12.5 : 5;
      const commissionAmount = Number(payload.amount) * (percentage / 100);

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
          payload.appointmentId,
          payment.id,
          payload.referrerUserId,
          payload.referrerType,
          payload.referralCodeId,
          payload.amount,
          percentage,
          commissionAmount
        ]
      );

      commission = commissionResult.rows[0];

      const balanceResult = await client.query(
        `
          UPDATE saldo_usuario
          SET saldo_disponible = saldo_disponible + $2, fecha_actualizacion = NOW()
          WHERE usuario_id = $1
          RETURNING id
        `,
        [payload.referrerUserId, commissionAmount]
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
          VALUES ($1, $2, 'credito', 'comision', $3, $4, 'Comisión por pago exitoso de cita', 'aplicado')
          RETURNING id, monto AS amount, estado AS status
        `,
        [balanceResult.rows[0].id, payload.referrerUserId, commission.id, commissionAmount]
      );

      balanceMovement = movementResult.rows[0];
    }

    return {
      payment,
      commission,
      balanceMovement,
      alreadyPaid: false
    };
  });
}

module.exports = {
  createDummyPayment,
  findAppointmentForPayment
};
