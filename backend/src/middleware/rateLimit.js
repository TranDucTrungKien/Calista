const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.' },
});

module.exports = { authLimiter };
