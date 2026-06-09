const Category = require('../models/category');

exports.list = async (_req, res, next) => {
  try {
    const items = await Category.find().sort({ order: 1, name: 1 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const cat = await Category.create(req.body);
    res.status(201).json({ category: cat });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!cat) {
      const err = new Error('Không tìm thấy danh mục');
      err.status = 404;
      err.expose = true;
      throw err;
    }
    res.json({ category: cat });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa danh mục' });
  } catch (err) {
    next(err);
  }
};
