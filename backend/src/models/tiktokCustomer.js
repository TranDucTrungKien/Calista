const mongoose = require('mongoose');

const TikTokCustomerSchema = new mongoose.Schema(
  {
    buyerUid: { type: String, required: true, unique: true, index: true },
    shopId: { type: String, required: true, index: true },
    displayName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    totalOrders: { type: Number, default: 0 },
    totalSpend: { type: Number, default: 0 },
    lastOrderAt: { type: Date, default: null },
    firstSeenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TikTokCustomer', TikTokCustomerSchema);
