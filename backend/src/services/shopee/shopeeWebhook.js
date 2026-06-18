const crypto = require('crypto');
const ShopeeOrder = require('../../models/shopeeOrder');
const ShopeeProduct = require('../../models/shopeeProduct');
const ShopeeSyncLog = require('../../models/shopeeSyncLog');

const REPLAY_WINDOW_MS = 5 * 60 * 1000;

/**
 * Shopee webhook signature:
 * HMAC-SHA256(key=partner_key, data=partner_id + '.' + path + '.' + timestamp + '.' + rawBody)
 */
function validateSignature(rawBody, path, timestamp, receivedSign) {
  const partnerKey = process.env.SHOPEE_PARTNER_KEY;
  const partnerId = process.env.SHOPEE_PARTNER_ID;
  if (!partnerKey) return false;

  const tsMs = parseInt(timestamp, 10) * 1000;
  if (Math.abs(Date.now() - tsMs) > REPLAY_WINDOW_MS) return false;

  const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
  const input = `${partnerId}.${path}.${timestamp}.${bodyStr}`;
  const computed = crypto.createHmac('sha256', partnerKey).update(input).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(receivedSign || ''));
  } catch (_) {
    return false;
  }
}

async function processEvent(code, data, shopId) {
  const start = Date.now();
  try {
    switch (code) {
      case 3: // ORDER_STATUS_UPDATE
        if (data.ordersn) {
          await ShopeeOrder.findOneAndUpdate(
            { shopeeOrderSn: data.ordersn },
            { orderStatus: data.status, syncedAt: new Date() }
          );
        }
        break;
      case 10: // SHOP_UPDATE (product status)
        break;
      default:
        break;
    }

    await ShopeeSyncLog.create({
      shopId,
      operation: 'webhook_received',
      status: 'success',
      durationMs: Date.now() - start,
      triggeredBy: 'webhook',
      meta: { code },
    });
  } catch (err) {
    await ShopeeSyncLog.create({
      shopId,
      operation: 'webhook_received',
      status: 'error',
      errorMessage: err.message,
      durationMs: Date.now() - start,
      triggeredBy: 'webhook',
      meta: { code },
    });
  }
}

module.exports = { validateSignature, processEvent };
