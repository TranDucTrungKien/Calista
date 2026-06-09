const tiktokSeller = require('../../services/tiktok/tiktokSeller');
const tiktokProducts = require('../../services/tiktok/tiktokProducts');
const tiktokOrders = require('../../services/tiktok/tiktokOrders');
const TikTokAccount = require('../../models/tiktokAccount');
const TikTokSyncLog = require('../../models/tiktokSyncLog');

async function getShopId() {
  const account = await TikTokAccount.findOne({ isConnected: true }).lean();
  if (!account) {
    const err = new Error('TikTok Shop không được kết nối');
    err.status = 503;
    err.expose = true;
    throw err;
  }
  return account.shopId;
}

exports.getSeller = async (req, res, next) => {
  try {
    const shopId = await getShopId();
    const seller = await tiktokSeller.getSellerProfile(shopId);
    res.json({ seller });
  } catch (err) {
    next(err);
  }
};

exports.listProducts = async (req, res, next) => {
  try {
    const shopId = await getShopId();
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const status = req.query.status || undefined;
    const result = await tiktokProducts.getProductList(shopId, { page, limit, status });
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
    const result = await tiktokOrders.getOrderList(shopId, { page, limit, status, startDate, endDate });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getOrderDetail = async (req, res, next) => {
  try {
    const shopId = await getShopId();
    const order = await tiktokOrders.getOrderDetail(shopId, req.params.orderId);
    if (!order) {
      const err = new Error('Order not found');
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
    const shipping = await tiktokOrders.getShippingInfo(shopId, req.params.orderId);
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
      TikTokSyncLog.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      TikTokSyncLog.countDocuments(filter),
    ]);

    res.json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
};

exports.getTokenHealth = async (req, res, next) => {
  try {
    const account = await TikTokAccount.findOne({ isConnected: true })
      .select('shopId shopName isConnected accessTokenExpiresAt refreshTokenExpiresAt lastSyncAt')
      .sort({ createdAt: -1 })
      .lean();

    if (!account) {
      return res.json({ isConnected: false });
    }

    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const refreshTokenWarning =
      Date.now() + thirtyDaysMs >= new Date(account.refreshTokenExpiresAt).getTime();

    res.json({ ...account, refreshTokenWarning });
  } catch (err) {
    next(err);
  }
};
