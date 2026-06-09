const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
  {
    tiktokItemId: String,
    tiktokSkuId: String,
    title: String,
    quantity: { type: Number, default: 1 },
    salePrice: { type: Number, default: 0 },
  },
  { _id: false }
);

const AddressSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    fullAddress: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  { _id: false }
);

const TikTokOrderSchema = new mongoose.Schema(
  {
    tiktokOrderId: { type: String, required: true, unique: true, index: true },
    shopId: { type: String, required: true, index: true },
    localOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    buyerUid: { type: String, index: true },
    status: {
      type: String,
      enum: [
        'UNPAID',
        'ON_HOLD',
        'AWAITING_SHIPMENT',
        'AWAITING_COLLECTION',
        'IN_TRANSIT',
        'DELIVERED',
        'COMPLETED',
        'CANCELLED',
      ],
      index: true,
    },
    paymentMethod: { type: String, default: '' },
    currency: { type: String, default: '' },
    totalOriginalPrice: { type: Number, default: 0 },
    totalSellerDiscount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    items: [OrderItemSchema],
    recipientAddress: AddressSchema,
    trackingNumber: { type: String, default: '' },
    shippingProvider: { type: String, default: '' },
    tiktokCreatedAt: { type: Date },
    syncedAt: { type: Date, index: true },
    rawData: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

TikTokOrderSchema.index({ shopId: 1, status: 1 });
TikTokOrderSchema.index({ shopId: 1, syncedAt: -1 });

module.exports = mongoose.model('TikTokOrder', TikTokOrderSchema);
