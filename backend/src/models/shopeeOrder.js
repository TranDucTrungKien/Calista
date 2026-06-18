const mongoose = require('mongoose');

const ShopeeOrderItemSchema = new mongoose.Schema(
  {
    shopeeItemId: Number,
    variationId: Number,
    name: String,
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

const ShopeeOrderSchema = new mongoose.Schema(
  {
    shopeeOrderSn: { type: String, required: true, unique: true, index: true },
    shopId: { type: Number, required: true, index: true },
    localOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    buyerUserId: { type: Number, index: true },
    buyerUsername: { type: String, default: '' },
    orderStatus: {
      type: String,
      enum: [
        'UNPAID', 'READY_TO_SHIP', 'RETRY_SHIP', 'SHIPPED', 'TO_CONFIRM_RECEIVE',
        'IN_CANCEL', 'CANCELLED', 'COMPLETED',
      ],
      index: true,
    },
    paymentMethod: { type: String, default: '' },
    currency: { type: String, default: 'VND' },
    totalAmount: { type: Number, default: 0 },
    items: [ShopeeOrderItemSchema],
    recipientName: { type: String, default: '' },
    recipientPhone: { type: String, default: '' },
    recipientAddress: { type: String, default: '' },
    trackingNumber: { type: String, default: '' },
    shippingCarrier: { type: String, default: '' },
    shopeeCreateTime: { type: Date },
    shopeeUpdateTime: { type: Date },
    syncedAt: { type: Date, index: true },
    rawData: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

ShopeeOrderSchema.index({ shopId: 1, orderStatus: 1 });
ShopeeOrderSchema.index({ shopId: 1, syncedAt: -1 });

module.exports = mongoose.model('ShopeeOrder', ShopeeOrderSchema);
