const Product = require('../models/product');
const Category = require('../models/category');
const Review = require('../models/review');

exports.list = async (req, res, next) => {
  try {
    const {
      category,
      skinType,
      tag,
      minPrice,
      maxPrice,
      q,
      sort = 'createdAt:desc',
      page = 1,
      limit = 12,
      featured,
    } = req.query;

    const filter = { isActive: true };
    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) filter.categories = cat._id;
      else return res.json({ items: [], total: 0, page: 1, limit });
    }
    if (skinType) filter.skinTypes = { $in: String(skinType).split(',') };
    if (tag) filter.tags = { $in: String(tag).split(',') };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (q) filter.$text = { $search: q };
    if (featured === 'true') filter.isFeatured = true;

    const [sortField, sortDir] = String(sort).split(':');
    const sortObj = { [sortField || 'createdAt']: sortDir === 'asc' ? 1 : -1 };

    const lim = Math.min(Number(limit) || 12, 60);
    const pg = Math.max(Number(page) || 1, 1);

    const [items, total] = await Promise.all([
      Product.find(filter)
        .populate('categories', 'name slug')
        .sort(sortObj)
        .skip((pg - 1) * lim)
        .limit(lim),
      Product.countDocuments(filter),
    ]);

    res.json({ items, total, page: pg, limit: lim });
  } catch (err) {
    next(err);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug, isActive: true }).populate(
      'categories',
      'name slug'
    );
    if (!product) {
      const err = new Error('Không tìm thấy sản phẩm');
      err.status = 404;
      err.expose = true;
      throw err;
    }
    const primaryCatId = product.categories?.[0]?._id;
    const related = await Product.find({
      categories: primaryCatId,
      _id: { $ne: product._id },
      isActive: true,
    })
      .limit(4)
      .populate('categories', 'name slug');
    res.json({ product, related });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      const err = new Error('Không tìm thấy sản phẩm');
      err.status = 404;
      err.expose = true;
      throw err;
    }
    res.json({ product });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) {
      const err = new Error('Không tìm thấy sản phẩm');
      err.status = 404;
      err.expose = true;
      throw err;
    }
    res.json({ message: 'Đã xóa sản phẩm' });
  } catch (err) {
    next(err);
  }
};

exports.recalcRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { productId } },
    {
      $group: {
        _id: '$productId',
        avg: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);
  const ratings = stats[0]
    ? { avg: Math.round(stats[0].avg * 10) / 10, count: stats[0].count }
    : { avg: 0, count: 0 };
  await Product.findByIdAndUpdate(productId, { ratings });
};
