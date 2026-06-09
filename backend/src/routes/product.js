const router = require('express').Router();
const ctrl = require('../controllers/product');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', ctrl.list);
router.get('/:slug', ctrl.detail);
router.post('/', requireAuth, requireAdmin, ctrl.create);
router.put('/:id', requireAuth, requireAdmin, ctrl.update);
router.delete('/:id', requireAuth, requireAdmin, ctrl.remove);

module.exports = router;
