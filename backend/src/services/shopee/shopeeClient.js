const { ensureFreshToken } = require('./shopeeAuth');
const { buildSignedParams } = require('./shopeeSigner');
const ShopeeSyncLog = require('../../models/shopeeSyncLog');

const BASE = () => process.env.SHOPEE_API_BASE || 'https://partner.shopeemobile.com';
const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function request(shopId, method, path, queryParams = {}, body = null) {
  const account = await ensureFreshToken(shopId);

  const partnerKey = process.env.SHOPEE_PARTNER_KEY;
  const partnerId = parseInt(process.env.SHOPEE_PARTNER_ID, 10);

  const signedParams = buildSignedParams(
    partnerKey,
    partnerId,
    path,
    queryParams,
    account.accessToken,
    account.shopId
  );

  const url = new URL(BASE() + path);
  Object.entries(signedParams).forEach(([k, v]) => url.searchParams.set(k, v));

  const fetchOptions = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) fetchOptions.body = JSON.stringify(body);

  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      const res = await fetch(url.toString(), fetchOptions);

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10);
        await sleep(retryAfter * 1000);
        attempt++;
        continue;
      }

      if (res.status >= 500) {
        const delays = [0, 1000, 3000];
        await sleep(delays[attempt] || 3000);
        attempt++;
        continue;
      }

      const data = await res.json();

      if (data.error && data.error !== '') {
        const err = new Error(data.message || `Shopee API error: ${data.error}`);
        err.shopeeError = data.error;
        err.status = 502;
        err.expose = true;
        throw err;
      }

      return data;
    } catch (err) {
      if (err.shopeeError) throw err;
      attempt++;
      if (attempt >= MAX_RETRIES) {
        const wrapped = new Error(`Shopee request failed after ${MAX_RETRIES} attempts: ${err.message}`);
        wrapped.status = 503;
        wrapped.expose = true;
        throw wrapped;
      }
      const delays = [0, 1000, 3000];
      await sleep(delays[attempt] || 3000);
    }
  }
}

async function get(shopId, path, queryParams = {}) {
  return request(shopId, 'GET', path, queryParams, null);
}

async function post(shopId, path, queryParams = {}, body = {}) {
  return request(shopId, 'POST', path, queryParams, body);
}

module.exports = { get, post };
