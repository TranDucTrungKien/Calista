const { get, post } = require('./tiktokClient');
const TikTokOrder = require('../../models/tiktokOrder');
const TikTokCustomer = require('../../models/tiktokCustomer');
const TikTokAccount = require('../../models/tiktokAccount');
const TikTokSyncLog = require('../../models/tiktokSyncLog');

const ORDER_SEARCH_PATH = '/api/order/202309/orders/search';
const ORDER_DETAIL_PATH = '/api/order/202309/orders';
const PACKAGE_PATH = '/api/fulfillment/202309/packages';

/**
 * Syncs orders for a time range. Paginates automatically.
 * Upserts orders and customer records.
 */
async function syncOrders(shopId, startTime, endTime) {
  const start = Date.now();
  let totalSynced = 0;
  let cursor = '';

  // Default to last 7 days if no range provided
  const tsStart = startTime
    ? Math.floor(new Date(startTime).getTime() / 1000)
    : Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
  const tsEnd = endTime
    ? Math.floor(new Date(endTime).getTime() / 1000)
    : Math.floor(Date.now() / 1000);

  try {
    do {
      const body = {
        create_time_ge: tsStart,
        create_time_lt: tsEnd,
        page_size: 20,
      };
      if (cursor) body.cursor = cursor;

      const data = await post(shopId, ORDER_SEARCH_PATH, {}, body);
      const orders = data.data?.orders || [];
      cursor = data.data?.next_cursor || '';

      for (const o of orders) {
        const recipientAddress = o.recipient_address
          ? {
              name: o.recipient_address.name || '',
              phone: o.recipient_address.phone_number || '',
              fullAddress: o.recipient_address.full_address || '',
              city: o.recipient_address.district_info?.find((d) => d.address_level_name === 'CITY')?.address_name || '',
              state: o.recipient_address.region_code || '',
              zipCode: o.recipient_address.postal_code || '',
              country: o.recipient_address.region_code || '',
            }
          : {};

        const orderDoc = {
          tiktokOrderId: o.id,
          shopId,
          buyerUid: o.buyer_uid || '',
          status: o.status || 'UNPAID',
          paymentMethod: o.payment_method_name || '',
          currency: o.currency || '',
          totalOriginalPrice: parseFloat(o.payment?.original_total_product_price || 0),
          totalSellerDiscount: parseFloat(o.payment?.seller_discount || 0),
          totalAmount: parseFloat(o.payment?.total_amount || 0),
          items: (o.line_items || []).map((li) => ({
            tiktokItemId: li.item_id || '',
            tiktokSkuId: li.sku_id || '',
            title: li.product_name || '',
            quantity: li.quantity || 1,
            salePrice: parseFloat(li.sale_price || 0),
          })),
          recipientAddress,
          trackingNumber: o.tracking_number || '',
          shippingProvider: o.shipping_provider_name || '',
          tiktokCreatedAt: o.create_time ? new Date(o.create_time * 1000) : null,
          syncedAt: new Date(),
          rawData: o,
        };

        await TikTokOrder.findOneAndUpdate(
          { tiktokOrderId: o.id },
          orderDoc,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Upsert customer record
        if (o.buyer_uid) {
          await _upsertCustomer(shopId, o);
        }

        totalSynced++;
      }
    } while (cursor);

    await TikTokAccount.findOneAndUpdate({ shopId }, { lastSyncAt: new Date() });

    await TikTokSyncLog.create({
      shopId,
      operation: 'sync_orders',
      status: 'success',
      itemsAffected: totalSynced,
      durationMs: Date.now() - start,
      triggeredBy: 'manual',
    });

    return { synced: totalSynced };
  } catch (err) {
    await TikTokSyncLog.create({
      shopId,
      operation: 'sync_orders',
      status: 'error',
      itemsAffected: totalSynced,
      errorMessage: err.message,
      durationMs: Date.now() - start,
      triggeredBy: 'manual',
    });
    throw err;
  }
}

/** Fetches fresh order detail from TikTok and updates local mirror. */
async function getOrderDetail(shopId, tiktokOrderId) {
  const data = await get(shopId, ORDER_DETAIL_PATH, { order_id_list: tiktokOrderId });
  const order = data.data?.orders?.[0];

  if (order) {
    await TikTokOrder.findOneAndUpdate(
      { tiktokOrderId },
      { rawData: order, syncedAt: new Date() },
      { new: true }
    );
  }

  return TikTokOrder.findOne({ tiktokOrderId }).lean();
}

/** Returns logistics / tracking info for an order. */
async function getShippingInfo(shopId, tiktokOrderId) {
  const data = await get(shopId, PACKAGE_PATH, { order_id: tiktokOrderId });
  return data.data || {};
}

/** Paginates local order mirror for admin display. */
async function getOrderList(shopId, { page = 1, limit = 20, status, startDate, endDate } = {}) {
  const filter = { shopId };
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.tiktokCreatedAt = {};
    if (startDate) filter.tiktokCreatedAt.$gte = new Date(startDate);
    if (endDate) filter.tiktokCreatedAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    TikTokOrder.find(filter).skip(skip).limit(limit).sort({ tiktokCreatedAt: -1 }).lean(),
    TikTokOrder.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

async function _upsertCustomer(shopId, order) {
  const buyerUid = order.buyer_uid;
  const amount = parseFloat(order.payment?.total_amount || 0);
  const orderTime = order.create_time ? new Date(order.create_time * 1000) : new Date();

  const existing = await TikTokCustomer.findOne({ buyerUid });
  if (existing) {
    await TikTokCustomer.findOneAndUpdate(
      { buyerUid },
      {
        $inc: { totalOrders: 1, totalSpend: amount },
        $max: { lastOrderAt: orderTime },
      }
    );
  } else {
    await TikTokCustomer.create({
      buyerUid,
      shopId,
      displayName: order.recipient_address?.name || '',
      phone: order.recipient_address?.phone_number || '',
      totalOrders: 1,
      totalSpend: amount,
      lastOrderAt: orderTime,
      firstSeenAt: orderTime,
    });
  }
}

module.exports = { syncOrders, getOrderDetail, getShippingInfo, getOrderList };
