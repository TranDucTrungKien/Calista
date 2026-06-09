/**
 * Stub thanh toán MoMo và ZaloPay (sandbox).
 * Ở môi trường thật, thay phần buildPaymentUrl bằng request đến endpoint
 * của MoMo (/v2/gateway/api/create) hoặc ZaloPay (/v2/create) với chữ ký HMAC.
 */

function buildMomoUrl(order) {
  const base = process.env.MOMO_REDIRECT_URL || 'http://localhost:4200/orders/result';
  const url = new URL(base);
  url.searchParams.set('orderId', order.code);
  url.searchParams.set('amount', String(order.totalAmount));
  url.searchParams.set('provider', 'momo');
  url.searchParams.set('resultCode', '0');
  return url.toString();
}

function buildZaloPayUrl(order) {
  const base = process.env.ZALOPAY_REDIRECT_URL || 'http://localhost:4200/orders/result';
  const url = new URL(base);
  url.searchParams.set('apptransid', order.code);
  url.searchParams.set('amount', String(order.totalAmount));
  url.searchParams.set('provider', 'zalopay');
  url.searchParams.set('status', '1');
  return url.toString();
}

async function createPayment({ provider, order }) {
  if (provider === 'momo') {
    return {
      provider: 'momo',
      payUrl: buildMomoUrl(order),
      orderCode: order.code,
    };
  }
  if (provider === 'zalopay') {
    return {
      provider: 'zalopay',
      payUrl: buildZaloPayUrl(order),
      orderCode: order.code,
    };
  }
  return { provider: 'cod', payUrl: null, orderCode: order.code };
}

module.exports = { createPayment };
