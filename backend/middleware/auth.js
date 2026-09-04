// JWT auth middleware.
const { verifyToken } = require('../utils/jwt');
const { AppError } = require('../utils/errors');

function extractToken(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

function payloadToUser(payload) {
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    student_id: payload.student_id,
  };
}

// Attaches req.user if a valid token is present; otherwise continues as a guest.
// Used globally so any route can read the authenticated identity when available.
function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) req.user = payloadToUser(payload);
  }
  next();
}

// Rejects the request with 401 unless a valid token is present.
function requireAuth(req, res, next) {
  const token = extractToken(req);
  const payload = token && verifyToken(token);
  if (!payload) return next(new AppError('Authentication required. Please sign in.', 401));
  req.user = payloadToUser(payload);
  next();
}

module.exports = { optionalAuth, requireAuth };
