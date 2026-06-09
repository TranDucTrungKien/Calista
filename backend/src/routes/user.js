const router = require('express').Router();
const ctrl = require('../controllers/user');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);
router.get('/me', ctrl.me);
router.put('/me', ctrl.update);
router.put('/me/password', ctrl.changePassword);

router.post('/me/addresses', ctrl.addAddress);
router.put('/me/addresses/:addrId', ctrl.updateAddress);
router.delete('/me/addresses/:addrId', ctrl.removeAddress);

router.get('/me/wishlist', ctrl.getWishlist);
router.post('/me/wishlist', ctrl.toggleWishlist);

router.get('/', requireAdmin, ctrl.adminList);
router.put('/:id/role', requireAdmin, ctrl.adminUpdateRole);

module.exports = router;
