const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const authorizeRoles = require('../../middlewares/authorizeRoles');
const asyncHandler = require('../../utils/asyncHandler');
const usersController = require('./users.controller');

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles('administrador'));

router.get('/', asyncHandler(usersController.listUsers));
router.patch('/:id/block', asyncHandler(usersController.blockUser));
router.patch('/:id/unblock', asyncHandler(usersController.unblockUser));

module.exports = router;
