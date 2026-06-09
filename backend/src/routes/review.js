const router = require('express').Router();
const ctrl = require('../controllers/review');
const { requireAuth } = require('../middleware/auth');

router.get('/:productId', ctrl.list);
router.post('/:productId', requireAuth, ctrl.create);

module.exports = router;
