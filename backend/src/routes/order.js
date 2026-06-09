const router = require('express').Router();
const ctrl = require('../controllers/order');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);
router.get('/', ctrl.listMine);
router.post('/', ctrl.create);
router.get('/admin', requireAdmin, ctrl.adminList);
router.get('/:id', ctrl.detail);
router.put('/:id/cancel', ctrl.cancel);
router.put('/:id/status', requireAdmin, ctrl.updateStatus);

module.exports = router;
