// Reviews are not yet available — return empty stubs so the frontend doesn't error
exports.list = (_req, res) => {
  res.json({ items: [] });
};

exports.create = (_req, res) => {
  res.status(503).json({ message: 'Tính năng đánh giá chưa khả dụng' });
};
