const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const authorizeRoles = require('../../middlewares/authorizeRoles');
const asyncHandler = require('../../utils/asyncHandler');
const commissionersController = require('./commissioners.controller');

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles('comisionista'));

router.get('/overview', asyncHandler(commissionersController.getOverview));
router.get('/codes', asyncHandler(commissionersController.listCodes));
router.post('/codes', asyncHandler(commissionersController.createCode));
router.get('/patients', asyncHandler(commissionersController.listPatients));

module.exports = router;
