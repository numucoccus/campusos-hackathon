// Auth routes — Supabase Auth stores users (secure password hashing); we issue
// our own signed JWTs (jsonwebtoken) for API access.
const router = require('express').Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = require('../database/supabaseClient');
const { asyncHandler } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const { signToken } = require('../utils/jwt');
const { ValidationError, UnauthorizedError } = require('../utils/errors');

// IMPORTANT: signInWithPassword sets the signed-in user's session on the client
// it is called on, which would make the shared service-role client start querying
// as that user (and RLS would hide all rows). Use a dedicated client for sign-ins.
const authClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.user_metadata?.name || u.email,
    student_id: u.user_metadata?.student_id || '',
  };
}

// POST /api/auth/register  { name, student_id, email, password }
router.post('/register', asyncHandler(async (req, res) => {
  const { name, student_id, email, password } = req.body || {};
  if (!name || !student_id || !email || !password) {
    throw new ValidationError('name, student_id, email and password are all required');
  }
  if (password.length < 6) throw new ValidationError('Password must be at least 6 characters');

  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, student_id },
  });
  if (error) {
    if (/already/i.test(error.message)) throw new ValidationError('An account with this email already exists');
    throw new ValidationError(error.message);
  }

  const user = publicUser(created.user);
  res.status(201).json({ token: signToken(user), user });
}));

// POST /api/auth/login  { email, password }
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw new ValidationError('email and password are required');

  const { data, error } = await authClient.auth.signInWithPassword({ email, password });
  if (error) throw new UnauthorizedError('Invalid email or password');

  const user = publicUser(data.user);
  res.json({ token: signToken(user), user });
}));

// GET /api/auth/me  (Authorization: Bearer <token>)
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
