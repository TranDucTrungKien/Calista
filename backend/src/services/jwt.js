const jwt = require('jsonwebtoken');

function signAccess(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
}

function signRefresh(user) {
  return jwt.sign(
    { sub: user._id.toString(), type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );
}

function verifyRefresh(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

function refreshCookieOptions() {
  const days = 7;
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: days * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  };
}

module.exports = { signAccess, signRefresh, verifyRefresh, refreshCookieOptions };
