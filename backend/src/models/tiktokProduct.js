const mongoose = require('mongoose');

const SkuSchema = new mongoose.Schema(
  {
    skuId: String,
    skuName: String,
    price: Number,
    currencyCode: String,
    stock: { type: Number, default: 0 },
    sellerSku: String,
  },
  { _id: false }
);

const TikTokProductSchema = new mongoose.Schema(
  {
    tiktokProductId: { type: String, required: true, unique: true, index: true },
    shopId: { type: String, required: true, index: true },
    localProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['ACTIVATE', 'SOLD_OUT', 'INACTIVE', 'DELETED'],
      index: true,
    },
    skus: [SkuSchema],
    images: [String],
    categoryId: { type: String, default: '' },
    syncedAt: { type: Date, index: true },
    rawData: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

TikTokProductSchema.index({ shopId: 1, status: 1 });

module.exports = mongoose.model('TikTokProduct', TikTokProductSchema);
