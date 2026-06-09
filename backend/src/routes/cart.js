const router = require('express').Router();
const ctrl = require('../controllers/cart');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);
router.get('/', ctrl.get);
router.post('/', ctrl.add);
router.post('/merge', ctrl.merge);
router.put('/:itemId', ctrl.update);
router.delete('/:itemId', ctrl.remove);
router.delete('/', ctrl.clear);

module.exports = router;
