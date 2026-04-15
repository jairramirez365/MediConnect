const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const authorizeRoles = require('../../middlewares/authorizeRoles');
const asyncHandler = require('../../utils/asyncHandler');
const availabilityController = require('./availability.controller');

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles('medico'));

router.get('/me', asyncHandler(availabilityController.listMyAvailability));
router.post('/me', asyncHandler(availabilityController.createMyAvailability));
router.patch('/me/:id', asyncHandler(availabilityController.updateMyAvailability));
router.delete('/me/:id', asyncHandler(availabilityController.deleteMyAvailability));

module.exports = router;
