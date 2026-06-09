const { validationResult } = require('express-validator');

function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = {};
  for (const e of result.array()) {
    if (!errors[e.path]) errors[e.path] = e.msg;
  }
  const err = new Error('Dữ liệu không hợp lệ');
  err.status = 400;
  err.expose = true;
  err.errors = errors;
  return next(err);
}

module.exports = validate;
