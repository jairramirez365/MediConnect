const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const asyncHandler = require('../../utils/asyncHandler');
const profilesController = require('./profiles.controller');

const router = express.Router();

router.use(authenticate);

router.get('/me', asyncHandler(profilesController.getMyProfile));
router.patch('/me', asyncHandler(profilesController.updateMyProfile));

module.exports = router;
