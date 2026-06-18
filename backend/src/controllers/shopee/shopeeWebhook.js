const shopeeWebhookSvc = require('../../services/shopee/shopeeWebhook');
const ShopeeAccount = require('../../models/shopeeAccount');
const ShopeeSyncLog = require('../../models/shopeeSyncLog');

exports.receive = async (req, res) => {
  try {
    const timestamp = req.headers['authorization']?.match(/timestamp=(\d+)/)?.[1]
      || req.query.timestamp
      || '';
    const receivedSign = req.headers['authorization']?.match(/sign=([a-f0-9]+)/)?.[1]
      || req.query.sign
      || '';
    const path = req.path;
    const rawBody = req.body;

    if (!shopeeWebhookSvc.validateSignature(rawBody, path, timestamp, receivedSign)) {
      await ShopeeSyncLog.create({
        shopId: 0,
        operation: 'webhook_received',
        status: 'error',
        errorCode: 'INVALID_SIGNATURE',
        errorMessage: 'Shopee webhook signature invalid',
        triggeredBy: 'webhook',
      });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch (_) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    const shopId = payload.shop_id || 0;

    res.json({ error: '' });

    setImmediate(() =>
      shopeeWebhookSvc.processEvent(payload.code, payload.data || {}, shopId).catch((err) =>
        console.error('[Shopee Webhook] Error:', err.message)
      )
    );
  } catch (err) {
    console.error('[Shopee Webhook] Unexpected:', err.message);
    if (!res.headersSent) res.status(500).json({ error: 'Internal error' });
  }
};
