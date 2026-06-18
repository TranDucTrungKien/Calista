const jwt = require('jsonwebtoken');

async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      const err = new Error('Bạn cần đăng nhập');
      err.status = 401;
      err.expose = true;
      return next(err);
    }
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name || '',
      role: payload.role || 'customer',
    };
    return next();
  } catch (err) {
    err.status = 401;
    err.expose = true;
    err.message = 'Phiên đăng nhập đã hết hạn';
    return next(err);
  }
}

function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== 'admin') {
    const err = new Error('Bạn không có quyền truy cập');
    err.status = 403;
    err.expose = true;
    return next(err);
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };
