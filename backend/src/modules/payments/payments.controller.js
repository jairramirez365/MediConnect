const paymentsService = require('./payments.service');

async function listPayments(req, res) {
  const result = await paymentsService.listPayments({
    page: req.query.page,
    limit: req.query.limit,
    status: req.query.status,
    method: req.query.method,
    search: req.query.search
  }, req.user);

  res.status(200).json(result);
}

async function getPaymentsSummary(req, res) {
  const data = await paymentsService.getPaymentsSummary(req.user);

  res.status(200).json({
    data
  });
}

async function listPayableAppointments(req, res) {
  const data = await paymentsService.listPayableAppointments(req.user);

  res.status(200).json({
    data
  });
}

async function createPseCheckout(req, res) {
  const result = await paymentsService.createPseCheckout(req.params.appointmentId, req.body, req.user);

  res.status(201).json({
    message: 'PSE checkout created successfully',
    data: result
  });
}

async function confirmStagingPsePayment(req, res) {
  const result = await paymentsService.confirmStagingPsePayment(req.params.paymentId, req.body, req.user);

  res.status(200).json({
    message: 'Payment confirmed successfully',
    data: result
  });
}

async function createDummyPayment(req, res) {
  const result = await paymentsService.createDummyPayment(req.params.appointmentId, req.body, req.user);

  res.status(201).json({
    message: 'Payment created successfully',
    data: result
  });
}

module.exports = {
  confirmStagingPsePayment,
  createDummyPayment,
  createPseCheckout,
  getPaymentsSummary,
  listPayableAppointments,
  listPayments
};
