const mongoose = require('mongoose');

const TikTokSyncLogSchema = new mongoose.Schema(
  {
    shopId: { type: String, required: true, index: true },
    operation: {
      type: String,
      required: true,
      enum: [
        'oauth_connect',
        'oauth_disconnect',
        'token_refresh',
        'sync_products',
        'sync_orders',
        'sync_inventory',
        'webhook_received',
        'update_stock',
        'sync_seller',
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

// Auto-expire logs after 90 days
TikTokSyncLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
TikTokSyncLogSchema.index({ shopId: 1, operation: 1, createdAt: -1 });

module.exports = mongoose.model('TikTokSyncLog', TikTokSyncLogSchema);
