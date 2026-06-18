const shopeeProducts = require('../../services/shopee/shopeeProducts');
const shopeeOrders = require('../../services/shopee/shopeeOrders');
const ShopeeAccount = require('../../models/shopeeAccount');
const ShopeeSyncLog = require('../../models/shopeeSyncLog');

async function getShopId() {
  const account = await ShopeeAccount.findOne({ isConnected: true }).lean();
  if (!account) {
    const err = new Error('Shopee Shop chưa được kết nối');
    err.status = 503;
    err.expose = true;
    throw err;
  }
  return account.shopId;
}

exports.listProducts = async (req, res, next) => {
  try {
    const shopId = await getShopId();
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const status = req.query.status || undefined;
    const result = await shopeeProducts.getProductList(shopId, { page, limit, status });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.listOrders = async (req, res, next) => {
  try {
    const shopId = await getShopId();
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const { status, startDate, endDate } = req.query;
    const result = await shopeeOrders.getOrderList(shopId, { page, limit, status, startDate, endDate });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getOrderDetail = async (req, res, next) => {
  try {
    const shopId = await getShopId();
    const order = await shopeeOrders.getOrderDetail(shopId, req.params.orderSn);
    if (!order) {
      const err = new Error('Không tìm thấy đơn hàng');
      err.status = 404;
      err.expose = true;
      throw err;
    }
    res.json({ order });
  } catch (err) {
    next(err);
  }
};

exports.getShipping = async (req, res, next) => {
  try {
    const shopId = await getShopId();
    const shipping = await shopeeOrders.getShippingInfo(shopId, req.params.orderSn);
    res.json({ shipping });
  } catch (err) {
    next(err);
  }
};

exports.getSyncLogs = async (req, res, next) => {
  try {
    const shopId = await getShopId();
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const { operation, status } = req.query;
    const filter = { shopId };
    if (operation) filter.operation = operation;
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      ShopeeSyncLog.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      ShopeeSyncLog.countDocuments(filter),
    ]);
    res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
};

exports.getTokenHealth = async (req, res, next) => {
  try {
    const account = await ShopeeAccount.findOne({ isConnected: true })
      .select('shopId shopName isConnected accessTokenExpiresAt refreshTokenExpiresAt lastSyncAt region')
      .sort({ createdAt: -1 })
      .lean();

    if (!account) return res.json({ isConnected: false });

    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const refreshTokenWarning =
      Date.now() + thirtyDaysMs >= new Date(account.refreshTokenExpiresAt).getTime();

    res.json({ ...account, refreshTokenWarning });
  } catch (err) {
    next(err);
  }
};
