const { get } = require('./tiktokClient');
const TikTokAccount = require('../../models/tiktokAccount');
const TikTokSyncLog = require('../../models/tiktokSyncLog');

async function getSellerProfile(shopId) {
  const start = Date.now();
  try {
    const data = await get(shopId, '/api/seller/global/seller/get');
    const seller = data.data || {};

    // Update shop name in account document
    if (seller.name) {
      await TikTokAccount.findOneAndUpdate({ shopId }, { shopName: seller.name });
    }

    await TikTokSyncLog.create({
      shopId,
      operation: 'sync_seller',
      status: 'success',
      itemsAffected: 1,
      durationMs: Date.now() - start,
      triggeredBy: 'manual',
    });

    return seller;
  } catch (err) {
    await TikTokSyncLog.create({
      shopId,
      operation: 'sync_seller',
      status: 'error',
      errorMessage: err.message,
      durationMs: Date.now() - start,
      triggeredBy: 'manual',
    });
    throw err;
  }
}

module.exports = { getSellerProfile };
