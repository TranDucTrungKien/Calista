const router = require('express').Router();
const ctrl = require('../controllers/upload');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, ctrl.middleware, ctrl.handle);

module.exports = router;
