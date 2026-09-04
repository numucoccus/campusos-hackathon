const router = require('express').Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { runAgent } = require('../ai/agent');
const { ValidationError } = require('../utils/errors');

// POST /api/chat  { messages: [{role:'user'|'assistant', content}] }
router.post('/', asyncHandler(async (req, res) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new ValidationError('Body must include a non-empty "messages" array');
  }
  const clean = messages
    .filter((m) => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content }));
  if (clean.length === 0) throw new ValidationError('No valid messages provided');

  const result = await runAgent(clean);
  res.json(result);
}));

module.exports = router;
