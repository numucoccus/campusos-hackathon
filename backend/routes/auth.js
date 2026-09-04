// Auth routes — backed by Supabase Auth (GoTrue). The service-role client can
// create users and validate tokens; no extra tables or packages needed.
const router = require('express').Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = require('../database/supabaseClient');
const { asyncHandler } = require('../middleware/errorHandler');
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

  // Sign them in right away so the client gets a token (dedicated client — see note above).
  const { data: session, error: loginError } = await authClient.auth.signInWithPassword({ email, password });
  if (loginError) throw new ValidationError(loginError.message);

  res.status(201).json({ token: session.session.access_token, user: publicUser(created.user) });
}));

// POST /api/auth/login  { email, password }
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw new ValidationError('email and password are required');

  const { data, error } = await authClient.auth.signInWithPassword({ email, password });
  if (error) throw new UnauthorizedError('Invalid email or password');

  res.json({ token: data.session.access_token, user: publicUser(data.user) });
}));

// GET /api/auth/me  (Authorization: Bearer <token>)
router.get('/me', asyncHandler(async (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) throw new UnauthorizedError('Missing token');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new UnauthorizedError('Invalid or expired session');
  res.json({ user: publicUser(data.user) });
}));

module.exports = router;
