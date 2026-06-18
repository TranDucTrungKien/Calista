const shopeeProducts = require('../../services/shopee/shopeeProducts');
const shopeeOrders = require('../../services/shopee/shopeeOrders');
const ShopeeAccount = require('../../models/shopeeAccount');

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

exports.triggerProductSync = async (req, res, next) => {
  try {
    const shopId = await getShopId();
    res.json({ message: 'Đang đồng bộ sản phẩm từ Shopee...' });
    setImmediate(() =>
      shopeeProducts.syncProducts(shopId).catch((err) =>
        console.error('[Shopee] Product sync failed:', err.message)
      )
    );
  } catch (err) {
    next(err);
  }
};

exports.triggerOrderSync = async (req, res, next) => {
  try {
    const shopId = await getShopId();
    const { startDate, endDate } = req.body || {};
    res.json({ message: 'Đang đồng bộ đơn hàng từ Shopee...' });
    setImmediate(() =>
      shopeeOrders.syncOrders(shopId, startDate, endDate).catch((err) =>
        console.error('[Shopee] Order sync failed:', err.message)
      )
    );
  } catch (err) {
    next(err);
  }
};

exports.updateInventory = async (req, res, next) => {
  try {
    const shopId = await getShopId();
    const { shopeeItemId, modelId, quantity } = req.body || {};
    if (!shopeeItemId || quantity == null) {
      const err = new Error('Thiếu shopeeItemId hoặc quantity');
      err.status = 400;
      err.expose = true;
      throw err;
    }
    await shopeeProducts.updateStock(shopId, shopeeItemId, modelId, parseInt(quantity, 10));
    res.json({ message: 'Đã cập nhật tồn kho Shopee thành công' });
  } catch (err) {
    next(err);
  }
};
