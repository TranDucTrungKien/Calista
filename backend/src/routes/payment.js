const router = require('express').Router();
const ctrl = require('../controllers/payment');

router.post('/momo', ctrl.callback);
router.post('/zalopay', ctrl.callback);
router.post('/callback', ctrl.callback);

module.exports = router;
