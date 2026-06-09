const mongoose = require('mongoose');

const TikTokAccountSchema = new mongoose.Schema(
  {
    shopId: { type: String, required: true, unique: true, index: true },
    shopName: { type: String, default: '' },
    appKey: { type: String, required: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    accessTokenExpiresAt: { type: Date, required: true, index: true },
    refreshTokenExpiresAt: { type: Date, required: true },
    openId: { type: String, default: '' },
    sellerId: { type: String, default: '' },
    scope: { type: String, default: '' },
    isConnected: { type: Boolean, default: true, index: true },
    lastSyncAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TikTokAccount', TikTokAccountSchema);
