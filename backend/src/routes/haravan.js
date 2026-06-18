const router = require('express').Router();
const ctrl = require('../controllers/haravanController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/register', ctrl.register);
router.post('/auth/login', ctrl.login);
router.post('/auth/refresh', ctrl.authRefresh);
router.post('/auth/logout', ctrl.authLogout);

// ─── Products — public ────────────────────────────────────────────────────────
router.get('/products', ctrl.listProducts);
router.get('/products/count', ctrl.countProducts);
router.get('/products/:idOrSlug', ctrl.getProduct);

// ─── Categories (mapped collections) — public ────────────────────────────────
router.get('/categories', ctrl.listCategories);

// ─── Collections — public ────────────────────────────────────────────────────
router.get('/collections', ctrl.listCollections);
router.get('/collections/:id', ctrl.getCollection);

// ─── Current user — authenticated ────────────────────────────────────────────
router.get('/me', requireAuth, ctrl.getMe);
router.put('/me', requireAuth, ctrl.updateMe);
router.put('/me/password', requireAuth, ctrl.changePassword);

// ─── Orders (customer) — authenticated ───────────────────────────────────────
router.post('/orders', requireAuth, ctrl.createOrder);
router.get('/orders/mine', requireAuth, ctrl.listMyOrders);
router.get('/orders/:id', requireAuth, ctrl.getMyOrder);

// ─── Admin — orders + customers ───────────────────────────────────────────────
router.get('/admin/orders', requireAuth, requireAdmin, ctrl.listOrders);
router.get('/admin/orders/count', requireAuth, requireAdmin, ctrl.countOrders);
router.get('/admin/orders/:id', requireAuth, requireAdmin, ctrl.getOrder);
router.get('/admin/customers', requireAuth, requireAdmin, ctrl.listCustomers);
router.get('/admin/customers/:id', requireAuth, requireAdmin, ctrl.getCustomer);

module.exports = router;
