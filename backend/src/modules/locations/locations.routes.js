const express = require('express');

const asyncHandler = require('../../utils/asyncHandler');
const locationsController = require('./locations.controller');

const router = express.Router();

router.get('/departments', asyncHandler(locationsController.listDepartments));
router.get('/municipalities', asyncHandler(locationsController.listMunicipalities));

module.exports = router;
