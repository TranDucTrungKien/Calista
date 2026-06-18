const { get, post } = require('./shopeeClient');
const ShopeeOrder = require('../../models/shopeeOrder');
const ShopeeAccount = require('../../models/shopeeAccount');
const ShopeeSyncLog = require('../../models/shopeeSyncLog');

async function syncOrders(shopId, startTime, endTime) {
  const start = Date.now();
  let totalSynced = 0;

  const tsStart = startTime
    ? Math.floor(new Date(startTime).getTime() / 1000)
    : Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
  const tsEnd = endTime
    ? Math.floor(new Date(endTime).getTime() / 1000)
    : Math.floor(Date.now() / 1000);

  try {
    let cursor = '';
    let hasMore = true;

    while (hasMore) {
      const params = {
        time_range_field: 'create_time',
        time_from: tsStart,
        time_to: tsEnd,
        page_size: 50,
        response_optional_fields: 'buyer_user_id,buyer_username,item_list,recipient_address,total_amount',
      };
      if (cursor) params.cursor = cursor;

      const data = await get(shopId, '/api/v2/order/get_order_list', params);
      const orders = data.response?.order_list || [];
      cursor = data.response?.next_cursor || '';
      hasMore = data.response?.more ?? false;

      for (const o of orders) {
        await ShopeeOrder.findOneAndUpdate(
          { shopeeOrderSn: o.order_sn },
          {
            shopeeOrderSn: o.order_sn,
            shopId,
            buyerUserId: o.buyer_user_id,
            buyerUsername: o.buyer_username || '',
            orderStatus: o.order_status || 'UNPAID',
            totalAmount: parseFloat(o.total_amount || 0),
            currency: o.currency || 'VND',
            items: (o.item_list || []).map((i) => ({
              shopeeItemId: i.item_id,
              variationId: i.variation_id,
              name: i.item_name || '',
              quantity: i.model_quantity_purchased || 1,
              price: parseFloat(i.model_discounted_price || 0),
            })),
            recipientName: o.recipient_address?.name || '',
            recipientPhone: o.recipient_address?.phone || '',
            recipientAddress: o.recipient_address?.full_address || '',
            shopeeCreateTime: o.create_time ? new Date(o.create_time * 1000) : null,
            shopeeUpdateTime: o.update_time ? new Date(o.update_time * 1000) : null,
            syncedAt: new Date(),
            rawData: o,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        totalSynced++;
      }
    }

    await ShopeeAccount.findOneAndUpdate({ shopId }, { lastSyncAt: new Date() });

    await ShopeeSyncLog.create({
      shopId,
      operation: 'sync_orders',
      status: 'success',
      itemsAffected: totalSynced,
      durationMs: Date.now() - start,
      triggeredBy: 'manual',
    });

    return { synced: totalSynced };
  } catch (err) {
    await ShopeeSyncLog.create({
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

async function getOrderDetail(shopId, orderSn) {
  const data = await get(shopId, '/api/v2/order/get_order_detail', {
    order_sn_list: orderSn,
    response_optional_fields: 'buyer_user_id,buyer_username,item_list,recipient_address,total_amount,package_list',
  });

  const order = data.response?.order_list?.[0];
  if (order) {
    await ShopeeOrder.findOneAndUpdate(
      { shopeeOrderSn: orderSn },
      { rawData: order, syncedAt: new Date() }
    );
  }

  return ShopeeOrder.findOne({ shopeeOrderSn: orderSn }).lean();
}

async function getShippingInfo(shopId, orderSn) {
  const data = await get(shopId, '/api/v2/logistics/get_tracking_number', {
    order_sn: orderSn,
  });
  return data.response || {};
}

async function getOrderList(shopId, { page = 1, limit = 20, status, startDate, endDate } = {}) {
  const filter = { shopId };
  if (status) filter.orderStatus = status;
  if (startDate || endDate) {
    filter.shopeeCreateTime = {};
    if (startDate) filter.shopeeCreateTime.$gte = new Date(startDate);
    if (endDate) filter.shopeeCreateTime.$lte = new Date(endDate);
  }
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    ShopeeOrder.find(filter).skip(skip).limit(limit).sort({ shopeeCreateTime: -1 }).lean(),
    ShopeeOrder.countDocuments(filter),
  ]);
  return { items, total, page, limit };
}

module.exports = { syncOrders, getOrderDetail, getShippingInfo, getOrderList };
