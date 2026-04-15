const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const env = require('../../config/env');
const rateLimit = require('../../middlewares/rateLimit');
const asyncHandler = require('../../utils/asyncHandler');
const authController = require('./auth.controller');

const router = express.Router();
const authRateLimit = rateLimit({
  windowMs: env.rateLimit.authWindowMs,
  maxRequests: env.rateLimit.authMaxRequests
});

router.post('/register', authRateLimit, asyncHandler(authController.register));
router.post('/login', authRateLimit, asyncHandler(authController.login));
router.get('/me', authenticate, asyncHandler(authController.me));

module.exports = router;
