function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message =
    err.expose || status < 500
      ? err.message
      : 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.';
  if (status >= 500) console.error(err);
  res.status(status).json({
    message,
    ...(err.errors ? { errors: err.errors } : {}),
  });
}

module.exports = errorHandler;
