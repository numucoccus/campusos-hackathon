// JWT helpers — sign and verify our own tokens.
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!SECRET) {
  console.error('Missing JWT_SECRET. Add it to backend/.env (any long random string).');
  process.exit(1);
}

// Build a signed JWT for a user. Claims are the identity the rest of the app trusts.
function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      student_id: user.student_id,
    },
    SECRET,
    { expiresIn: EXPIRES_IN }
  );
}

// Verify a token and return its decoded payload, or null if invalid/expired.
function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

module.exports = { signToken, verifyToken };
