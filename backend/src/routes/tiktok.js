const router = require('express').Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');

const oauthCtrl = require('../controllers/tiktok/tiktokOAuth');
const adminCtrl = require('../controllers/tiktok/tiktokAdmin');
const syncCtrl = require('../controllers/tiktok/tiktokSync');
// Webhook is registered directly in app.js before express.json() — not here

// ── OAuth ──────────────────────────────────────────────────
// GET TikTok authorization URL
router.post('/oauth/initiate', requireAuth, requireAdmin, oauthCtrl.initiateOAuth);
// TikTok redirects here after seller authorizes (no JWT auth — browser redirect)
router.get('/oauth/callback', oauthCtrl.handleCallback);
// Disconnect the connected shop
router.delete('/oauth/disconnect', requireAuth, requireAdmin, oauthCtrl.disconnect);
// Current connection status + token expiry info
router.get('/oauth/status', requireAuth, requireAdmin, oauthCtrl.getStatus);

// ── Seller ─────────────────────────────────────────────────
router.get('/seller', requireAuth, requireAdmin, adminCtrl.getSeller);

// ── Products ───────────────────────────────────────────────
router.get('/products', requireAuth, requireAdmin, adminCtrl.listProducts);

// ── Orders ─────────────────────────────────────────────────
router.get('/orders', requireAuth, requireAdmin, adminCtrl.listOrders);
router.get('/orders/:orderId', requireAuth, requireAdmin, adminCtrl.getOrderDetail);
router.get('/orders/:orderId/shipping', requireAuth, requireAdmin, adminCtrl.getShipping);

// ── Logs & Token Health ────────────────────────────────────
router.get('/logs', requireAuth, requireAdmin, adminCtrl.getSyncLogs);
router.get('/token-health', requireAuth, requireAdmin, adminCtrl.getTokenHealth);

// ── Sync & Inventory ───────────────────────────────────────
router.post('/sync/products', requireAuth, requireAdmin, syncCtrl.triggerProductSync);
router.post('/sync/orders', requireAuth, requireAdmin, syncCtrl.triggerOrderSync);
router.put('/inventory', requireAuth, requireAdmin, syncCtrl.updateInventory);

module.exports = router;
