const paymentsService = require('./payments.service');

async function createDummyPayment(req, res) {
  const result = await paymentsService.createDummyPayment(req.params.appointmentId, req.body, req.user);

  res.status(201).json({
    message: 'Payment created successfully',
    data: result
  });
}

module.exports = {
  createDummyPayment
};
