const mongoose = require('mongoose');

const ShopeeProductSchema = new mongoose.Schema(
  {
    shopeeItemId: { type: Number, required: true, unique: true, index: true },
    shopId: { type: Number, required: true, index: true },
    localProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['NORMAL', 'DELETED', 'BANNED', 'UNLIST'],
      default: 'NORMAL',
      index: true,
    },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'VND' },
    stock: { type: Number, default: 0 },
    images: [String],
    categoryId: { type: Number },
    syncedAt: { type: Date, index: true },
    rawData: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

ShopeeProductSchema.index({ shopId: 1, status: 1 });

module.exports = mongoose.model('ShopeeProduct', ShopeeProductSchema);
