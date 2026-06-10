const express = require('express');

const authenticate = require('../../middlewares/authenticate');
const asyncHandler = require('../../utils/asyncHandler');
const chatController = require('./chat.controller');

const router = express.Router();

router.use(authenticate);

router.get('/contacts', asyncHandler(chatController.listAvailableContacts));
router.get('/conversations', asyncHandler(chatController.listConversations));
router.post('/conversations', asyncHandler(chatController.openConversation));
router.get('/conversations/:id', asyncHandler(chatController.getConversation));
router.post('/conversations/:id/messages', asyncHandler(chatController.sendMessage));
router.patch('/conversations/:id/read', asyncHandler(chatController.markRead));

module.exports = router;
