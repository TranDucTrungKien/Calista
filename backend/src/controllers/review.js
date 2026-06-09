const Review = require('../models/review');
const { recalcRating } = require('./product');

exports.list = async (req, res, next) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ items: reviews });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { rating, comment, images = [] } = req.body;
    const review = await Review.create({
      userId: req.user._id,
      productId: req.params.productId,
      rating,
      comment,
      images,
    });
    await recalcRating(req.params.productId);
    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
};
