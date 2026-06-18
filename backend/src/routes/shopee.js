const router = require('express').Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');

const oauthCtrl = require('../controllers/shopee/shopeeOAuth');
const adminCtrl = require('../controllers/shopee/shopeeAdmin');
const syncCtrl = require('../controllers/shopee/shopeeSync');

// ── OAuth ──────────────────────────────────────────────────
router.post('/oauth/initiate', requireAuth, requireAdmin, oauthCtrl.initiateOAuth);
router.get('/oauth/callback', oauthCtrl.handleCallback);
router.delete('/oauth/disconnect', requireAuth, requireAdmin, oauthCtrl.disconnect);
router.get('/oauth/status', requireAuth, requireAdmin, oauthCtrl.getStatus);

// ── Products ───────────────────────────────────────────────
router.get('/products', requireAuth, requireAdmin, adminCtrl.listProducts);

// ── Orders ─────────────────────────────────────────────────
router.get('/orders', requireAuth, requireAdmin, adminCtrl.listOrders);
router.get('/orders/:orderSn', requireAuth, requireAdmin, adminCtrl.getOrderDetail);
router.get('/orders/:orderSn/shipping', requireAuth, requireAdmin, adminCtrl.getShipping);

// ── Logs & Token Health ────────────────────────────────────
router.get('/logs', requireAuth, requireAdmin, adminCtrl.getSyncLogs);
router.get('/token-health', requireAuth, requireAdmin, adminCtrl.getTokenHealth);

// ── Sync & Inventory ───────────────────────────────────────
router.post('/sync/products', requireAuth, requireAdmin, syncCtrl.triggerProductSync);
router.post('/sync/orders', requireAuth, requireAdmin, syncCtrl.triggerOrderSync);
router.put('/inventory', requireAuth, requireAdmin, syncCtrl.updateInventory);

module.exports = router;
