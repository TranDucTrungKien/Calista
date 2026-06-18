const crypto = require('crypto');

/**
 * Shopee API request signing.
 *
 * Public APIs (no access_token):
 *   sign = HMAC-SHA256(key=partner_key, data=partner_id|api_path|timestamp)
 *
 * Shop/merchant APIs (with access_token):
 *   sign = HMAC-SHA256(key=partner_key, data=partner_id|api_path|timestamp|access_token|shop_id)
 */
function sign(partnerKey, partnerId, path, timestamp, accessToken = '', shopId = '') {
  let base = `${partnerId}${path}${timestamp}`;
  if (accessToken) base += accessToken;
  if (shopId) base += shopId;
  return crypto.createHmac('sha256', partnerKey).update(base).digest('hex');
}

/**
 * Builds the signed query params for a Shopee API request.
 */
function buildSignedParams(partnerKey, partnerId, path, extra = {}, accessToken = '', shopId = '') {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign(partnerKey, partnerId, path, timestamp, accessToken, shopId ? String(shopId) : '');

  const params = {
    partner_id: partnerId,
    timestamp,
    sign: signature,
    ...extra,
  };

  if (accessToken) params.access_token = accessToken;
  if (shopId) params.shop_id = shopId;

  return params;
}

module.exports = { sign, buildSignedParams };
