const crypto = require('crypto');
const TikTokOrder = require('../../models/tiktokOrder');
const TikTokProduct = require('../../models/tiktokProduct');
const TikTokSyncLog = require('../../models/tiktokSyncLog');

const REPLAY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Validates a TikTok webhook signature.
 *
 * TikTok signs webhooks using:
 *   HMAC-SHA256(key=app_secret, data=timestamp + nonce + rawBodyString)
 * The result is hex-encoded and compared to the Authorization header.
 */
function validateSignature(rawBody, timestamp, nonce, receivedSign) {
  const secret = process.env.TIKTOK_WEBHOOK_SECRET || process.env.TIKTOK_APP_SECRET;
  if (!secret) return false;

  // Replay protection: reject stale requests
  const tsMs = parseInt(timestamp, 10) * 1000;
  if (Math.abs(Date.now() - tsMs) > REPLAY_WINDOW_MS) return false;

  const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
  const input = timestamp + nonce + bodyStr;
  const computed = crypto.createHmac('sha256', secret).update(input).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(receivedSign || ''));
  } catch (_) {
    return false;
  }
}

/**
 * Routes a validated webhook event to the appropriate handler.
 * Called asynchronously after the HTTP 200 ACK is sent.
 */
async function processEvent(eventType, payload, shopId) {
  const start = Date.now();
  try {
    switch (eventType) {
      case 'ORDER_STATUS_CHANGE':
      case 'ORDER_STATUS_UPDATE':
        await _handleOrderStatusChange(shopId, payload);
        break;

      case 'PRODUCT_STATUS_CHANGE':
        await _handleProductStatusChange(shopId, payload);
        break;

      case 'INVENTORY_UPDATE':
        await _handleInventoryUpdate(shopId, payload);
        break;

      default:
        // Log unhandled event types but don't error
        break;
    }

    await TikTokSyncLog.create({
      shopId,
      operation: 'webhook_received',
      status: 'success',
      durationMs: Date.now() - start,
      triggeredBy: 'webhook',
      meta: { eventType },
    });
  } catch (err) {
    await TikTokSyncLog.create({
      shopId,
      operation: 'webhook_received',
      status: 'error',
      errorMessage: err.message,
      durationMs: Date.now() - start,
      triggeredBy: 'webhook',
      meta: { eventType },
    });
  }
}

async function _handleOrderStatusChange(shopId, payload) {
  const orderId = payload.order_id || payload.id;
  if (!orderId) return;

  await TikTokOrder.findOneAndUpdate(
    { tiktokOrderId: orderId },
    {
      status: payload.order_status || payload.status,
      trackingNumber: payload.tracking_number || '',
      syncedAt: new Date(),
    }
  );
}

async function _handleProductStatusChange(shopId, payload) {
  const productId = payload.product_id || payload.id;
  if (!productId) return;

  await TikTokProduct.findOneAndUpdate(
    { tiktokProductId: productId },
    { status: payload.status, syncedAt: new Date() }
  );
}

async function _handleInventoryUpdate(shopId, payload) {
  const productId = payload.product_id;
  const skuId = payload.sku_id;
  const stock = payload.available_stock;
  if (!productId || !skuId) return;

  await TikTokProduct.findOneAndUpdate(
    { tiktokProductId: productId, 'skus.skuId': skuId },
    { $set: { 'skus.$.stock': stock, syncedAt: new Date() } }
  );
}

module.exports = { validateSignature, processEvent };
