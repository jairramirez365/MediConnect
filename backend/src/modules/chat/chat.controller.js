const chatService = require('./chat.service');

async function listConversations(req, res) {
  const data = await chatService.listConversations(req.user, req.query);
  res.status(200).json({ data });
}

async function listAvailableContacts(req, res) {
  const data = await chatService.listAvailableContacts(req.user, req.query);
  res.status(200).json({ data });
}

async function openConversation(req, res) {
  const data = await chatService.openConversation(req.body, req.user);
  res.status(201).json({ message: 'Conversation created successfully', data });
}

async function getConversation(req, res) {
  const data = await chatService.getConversation(req.params.id, req.user);
  res.status(200).json({ data });
}

async function sendMessage(req, res) {
  const data = await chatService.sendMessage(req.params.id, req.body, req.user);
  res.status(201).json({ message: 'Message sent successfully', data });
}

async function markRead(req, res) {
  const data = await chatService.markConversationRead(req.params.id, req.user);
  res.status(200).json({ message: 'Conversation marked as read', data });
}

module.exports = {
  getConversation,
  listAvailableContacts,
  listConversations,
  markRead,
  openConversation,
  sendMessage
};
