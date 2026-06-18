const mongoose = require('mongoose');

const ShopeeSyncLogSchema = new mongoose.Schema(
  {
    shopId: { type: Number, required: true, index: true },
    operation: {
      type: String,
      required: true,
      enum: [
        'oauth_connect', 'oauth_disconnect', 'token_refresh',
        'sync_products', 'sync_orders', 'update_stock',
        'webhook_received', 'sync_seller',
      ],
    },
    status: {
      type: String,
      required: true,
      enum: ['success', 'error', 'skipped'],
      index: true,
    },
    itemsAffected: { type: Number, default: 0 },
    errorCode: { type: String, default: '' },
    errorMessage: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed },
    durationMs: { type: Number, default: 0 },
    triggeredBy: {
      type: String,
      enum: ['cron', 'manual', 'webhook', 'system'],
      default: 'system',
    },
  },
  { timestamps: true }
);

ShopeeSyncLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
ShopeeSyncLogSchema.index({ shopId: 1, operation: 1, createdAt: -1 });

module.exports = mongoose.model('ShopeeSyncLog', ShopeeSyncLogSchema);
