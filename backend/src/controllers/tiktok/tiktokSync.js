const tiktokProducts = require('../../services/tiktok/tiktokProducts');
const tiktokOrders = require('../../services/tiktok/tiktokOrders');
const TikTokAccount = require('../../models/tiktokAccount');

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

// Fire-and-forget product sync: responds immediately, syncs in background
exports.triggerProductSync = async (req, res, next) => {
  try {
    const shopId = await getShopId();
    res.json({ message: 'Đang đồng bộ sản phẩm từ TikTok Shop...' });
    // Background execution after response
    setImmediate(() =>
      tiktokProducts.syncProducts(shopId).catch((err) =>
        console.error('[TikTok] Product sync failed:', err.message)
      )
    );
  } catch (err) {
    next(err);
  }
};

// Fire-and-forget order sync
exports.triggerOrderSync = async (req, res, next) => {
  try {
    const shopId = await getShopId();
    const { startDate, endDate } = req.body || {};
    res.json({ message: 'Đang đồng bộ đơn hàng từ TikTok Shop...' });
    setImmediate(() =>
      tiktokOrders.syncOrders(shopId, startDate, endDate).catch((err) =>
        console.error('[TikTok] Order sync failed:', err.message)
      )
    );
  } catch (err) {
    next(err);
  }
};

// Synchronous inventory update — admin expects immediate feedback
exports.updateInventory = async (req, res, next) => {
  try {
    const shopId = await getShopId();
    const { tiktokProductId, skuId, quantity } = req.body || {};

    if (!tiktokProductId || !skuId || quantity == null) {
      const err = new Error('Thiếu tiktokProductId, skuId hoặc quantity');
      err.status = 400;
      err.expose = true;
      throw err;
    }

    await tiktokProducts.updateStock(shopId, tiktokProductId, skuId, parseInt(quantity, 10));
    res.json({ message: 'Đã cập nhật tồn kho thành công' });
  } catch (err) {
    next(err);
  }
};
