const { get, post } = require('./tiktokClient');
const TikTokProduct = require('../../models/tiktokProduct');
const TikTokAccount = require('../../models/tiktokAccount');
const TikTokSyncLog = require('../../models/tiktokSyncLog');

const PRODUCT_LIST_PATH = '/api/product/202312/products';
const INVENTORY_UPDATE_PATH = '/api/product/202312/inventory/update';

/**
 * Paginates through all TikTok products and upserts them into MongoDB.
 * Updates TikTokAccount.lastSyncAt on success.
 */
async function syncProducts(shopId, pageSize = 20) {
  const start = Date.now();
  let totalSynced = 0;
  let pageToken = '';

  try {
    do {
      const params = { page_size: pageSize };
      if (pageToken) params.page_token = pageToken;

      const data = await get(shopId, PRODUCT_LIST_PATH, params);
      const products = data.data?.products || [];
      pageToken = data.data?.next_page_token || '';

      for (const p of products) {
        await TikTokProduct.findOneAndUpdate(
          { tiktokProductId: p.id },
          {
            tiktokProductId: p.id,
            shopId,
            title: p.title || '',
            description: p.description || '',
            status: p.status || 'INACTIVE',
            skus: (p.skus || []).map((s) => ({
              skuId: s.id,
              skuName: s.sales_attributes?.map((a) => a.value_name).join(' / ') || '',
              price: parseFloat(s.price?.original_price || 0),
              currencyCode: s.price?.currency || '',
              stock: s.stock_infos?.[0]?.available_stock || 0,
              sellerSku: s.seller_sku || '',
            })),
            images: (p.main_images || []).map((img) => img.urls?.[0] || ''),
            categoryId: p.category_id || '',
            syncedAt: new Date(),
            rawData: p,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        totalSynced++;
      }
    } while (pageToken);

    await TikTokAccount.findOneAndUpdate({ shopId }, { lastSyncAt: new Date() });

    await TikTokSyncLog.create({
      shopId,
      operation: 'sync_products',
      status: 'success',
      itemsAffected: totalSynced,
      durationMs: Date.now() - start,
      triggeredBy: 'manual',
    });

    return { synced: totalSynced };
  } catch (err) {
    await TikTokSyncLog.create({
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

/**
 * Updates stock for a specific SKU on TikTok Shop and in the local mirror.
 */
async function updateStock(shopId, tiktokProductId, skuId, newQuantity) {
  const start = Date.now();
  try {
    await post(shopId, INVENTORY_UPDATE_PATH, {}, {
      product_id: tiktokProductId,
      skus: [{ id: skuId, stock_infos: [{ available_stock: newQuantity }] }],
    });

    // Mirror update in local DB
    await TikTokProduct.findOneAndUpdate(
      { tiktokProductId, 'skus.skuId': skuId },
      { $set: { 'skus.$.stock': newQuantity, syncedAt: new Date() } }
    );

    await TikTokSyncLog.create({
      shopId,
      operation: 'update_stock',
      status: 'success',
      itemsAffected: 1,
      durationMs: Date.now() - start,
      triggeredBy: 'manual',
      meta: { tiktokProductId, skuId, newQuantity },
    });
  } catch (err) {
    await TikTokSyncLog.create({
      shopId,
      operation: 'update_stock',
      status: 'error',
      errorMessage: err.message,
      durationMs: Date.now() - start,
      triggeredBy: 'manual',
      meta: { tiktokProductId, skuId, newQuantity },
    });
    throw err;
  }
}

/** Queries the local product mirror with pagination and optional status filter. */
async function getProductList(shopId, { page = 1, limit = 20, status } = {}) {
  const filter = { shopId };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    TikTokProduct.find(filter).skip(skip).limit(limit).sort({ syncedAt: -1 }).lean(),
    TikTokProduct.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

module.exports = { syncProducts, updateStock, getProductList };
