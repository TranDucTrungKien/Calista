const { get, post } = require('./shopeeClient');
const ShopeeProduct = require('../../models/shopeeProduct');
const ShopeeAccount = require('../../models/shopeeAccount');
const ShopeeSyncLog = require('../../models/shopeeSyncLog');

async function syncProducts(shopId, pageSize = 100) {
  const start = Date.now();
  let totalSynced = 0;
  let offset = 0;

  try {
    let hasMore = true;
    while (hasMore) {
      const data = await get(shopId, '/api/v2/product/get_item_list', {
        offset,
        page_size: pageSize,
        item_status: 'NORMAL',
      });

      const items = data.response?.item || [];
      hasMore = data.response?.has_next_page ?? false;
      offset += items.length;

      for (const item of items) {
        await ShopeeProduct.findOneAndUpdate(
          { shopeeItemId: item.item_id },
          {
            shopeeItemId: item.item_id,
            shopId,
            name: item.item_name || '',
            status: item.item_status || 'NORMAL',
            images: (item.image?.image_url_list || []),
            categoryId: item.category_id,
            syncedAt: new Date(),
            rawData: item,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        totalSynced++;
      }
    }

    await ShopeeAccount.findOneAndUpdate({ shopId }, { lastSyncAt: new Date() });

    await ShopeeSyncLog.create({
      shopId,
      operation: 'sync_products',
      status: 'success',
      itemsAffected: totalSynced,
      durationMs: Date.now() - start,
      triggeredBy: 'manual',
    });

    return { synced: totalSynced };
  } catch (err) {
    await ShopeeSyncLog.create({
      shopId,
      operation: 'sync_products',
      status: 'error',
      itemsAffected: totalSynced,
      errorMessage: err.message,
      durationMs: Date.now() - start,
      triggeredBy: 'manual',
    });
    throw err;
  }
}

async function updateStock(shopId, shopeeItemId, modelId, newStock) {
  const start = Date.now();
  try {
    const stockList = modelId
      ? [{ model_id: modelId, normal_stock: newStock }]
      : [];

    await post(shopId, '/api/v2/product/update_stock', {}, {
      item_id: shopeeItemId,
      stock_list: stockList.length ? stockList : undefined,
      normal_stock: stockList.length ? undefined : newStock,
    });

    await ShopeeProduct.findOneAndUpdate(
      { shopeeItemId },
      { stock: newStock, syncedAt: new Date() }
    );

    await ShopeeSyncLog.create({
      shopId,
      operation: 'update_stock',
      status: 'success',
      itemsAffected: 1,
      durationMs: Date.now() - start,
      triggeredBy: 'manual',
      meta: { shopeeItemId, newStock },
    });
  } catch (err) {
    await ShopeeSyncLog.create({
      shopId,
      operation: 'update_stock',
      status: 'error',
      errorMessage: err.message,
      durationMs: Date.now() - start,
      triggeredBy: 'manual',
    });
    throw err;
  }
}

async function getProductList(shopId, { page = 1, limit = 20, status } = {}) {
  const filter = { shopId };
  if (status) filter.status = status;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    ShopeeProduct.find(filter).skip(skip).limit(limit).sort({ syncedAt: -1 }).lean(),
    ShopeeProduct.countDocuments(filter),
  ]);
  return { items, total, page, limit };
}

module.exports = { syncProducts, updateStock, getProductList };
