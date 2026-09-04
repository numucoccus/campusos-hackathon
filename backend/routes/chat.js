const router = require('express').Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { runAgent, DEFAULT_USER } = require('../ai/agent');
const { ValidationError } = require('../utils/errors');

// POST /api/chat  { messages: [{role:'user'|'assistant', content}], user?: {name, student_id} }
router.post('/', asyncHandler(async (req, res) => {
  const { messages, user } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new ValidationError('Body must include a non-empty "messages" array');
  }
  const clean = messages
    .filter((m) => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content }));
  if (clean.length === 0) throw new ValidationError('No valid messages provided');

  // Prefer the server-trusted JWT identity; fall back to the body (demo), then default.
  const agentUser = req.user
    ? { name: req.user.name, student_id: req.user.student_id }
    : user && typeof user.name === 'string' && user.name && typeof user.student_id === 'string' && user.student_id
      ? { name: user.name, student_id: user.student_id }
      : DEFAULT_USER;

  const result = await runAgent(clean, agentUser);
  res.json(result);
}));

module.exports = router;
