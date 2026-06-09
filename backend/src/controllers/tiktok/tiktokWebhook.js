const tiktokWebhookSvc = require('../../services/tiktok/tiktokWebhook');
const TikTokAccount = require('../../models/tiktokAccount');
const TikTokSyncLog = require('../../models/tiktokSyncLog');

exports.receive = async (req, res) => {
  try {
    // Headers sent by TikTok
    const timestamp = req.headers['x-tiktok-timestamp'] || req.headers['timestamp'];
    const nonce = req.headers['x-tiktok-nonce'] || req.headers['nonce'];
    const receivedSign = req.headers['x-tiktok-signature'] || req.headers['authorization'];

    // req.body is a raw Buffer (set by express.raw() in app.js)
    const rawBody = req.body;

    if (!tiktokWebhookSvc.validateSignature(rawBody, timestamp, nonce, receivedSign)) {
      await TikTokSyncLog.create({
        shopId: 'unknown',
        operation: 'webhook_received',
        status: 'error',
        errorCode: 'INVALID_SIGNATURE',
        errorMessage: 'Webhook signature validation failed',
        triggeredBy: 'webhook',
      });
      return res.status(401).json({ code: 401, message: 'Invalid signature' });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch (_) {
      return res.status(400).json({ code: 400, message: 'Invalid JSON body' });
    }

    const shopId = payload.shop_id || payload.data?.shop_id || 'unknown';

    // Verify this shop is connected
    if (shopId !== 'unknown') {
      const account = await TikTokAccount.findOne({ shopId }).lean();
      if (!account) {
        return res.status(404).json({ code: 404, message: 'Shop not found' });
      }
    }

    // ACK immediately — TikTok requires fast 200 response
    res.json({ code: 0 });

    // Process asynchronously after ACK
    setImmediate(() =>
      tiktokWebhookSvc.processEvent(payload.type, payload.data || payload, shopId).catch((err) =>
        console.error('[TikTok Webhook] Processing error:', err.message)
      )
    );
  } catch (err) {
    console.error('[TikTok Webhook] Unexpected error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ code: 500, message: 'Internal error' });
    }
  }
};
