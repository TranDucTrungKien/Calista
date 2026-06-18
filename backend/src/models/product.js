const mongoose = require('mongoose');
const slugify = require('slugify');

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, default: 0, min: 0 },
    description: { type: String, default: '' },
    ingredients: { type: String, default: '' },
    howToUse: { type: String, default: '' },
    images: { type: [String], default: [] },
    categories: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
      default: [],
      index: true,
    },
    skinTypes: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    stock: { type: Number, default: 0, min: 0 },
    ratings: {
      avg: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    isFeatured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', description: 'text' });

ProductSchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = slugify(this.name, { lower: true, locale: 'vi', strict: true });
  }
  next();
});

module.exports = mongoose.model('Product', ProductSchema);
