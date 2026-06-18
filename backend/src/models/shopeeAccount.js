const mongoose = require('mongoose');

const ShopeeAccountSchema = new mongoose.Schema(
  {
    shopId: { type: Number, required: true, unique: true, index: true },
    shopName: { type: String, default: '' },
    partnerId: { type: Number, required: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    accessTokenExpiresAt: { type: Date, required: true, index: true },
    refreshTokenExpiresAt: { type: Date, required: true },
    region: { type: String, default: 'VN' },
    isConnected: { type: Boolean, default: true, index: true },
    lastSyncAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShopeeAccount', ShopeeAccountSchema);
