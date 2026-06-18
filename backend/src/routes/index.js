const router = require('express').Router();

router.use('/auth', require('./auth'));
router.use('/products', require('./product'));
router.use('/categories', require('./category'));
router.use('/cart', require('./cart'));
router.use('/orders', require('./order'));
router.use('/users', require('./user'));
router.use('/reviews', require('./review'));
router.use('/payment', require('./payment'));
router.use('/upload', require('./upload'));
router.use('/tiktok', require('./tiktok'));
router.use('/shopee', require('./shopee'));

module.exports = router;
