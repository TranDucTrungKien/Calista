const { ensureFreshToken } = require('./tiktokAuth');
const { buildSignedParams } = require('./tiktokSigner');
const TikTokSyncLog = require('../../models/tiktokSyncLog');

const API_BASE = () => process.env.TIKTOK_API_BASE || 'https://open-api.tiktokglobalshop.com';
const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Core request function. Handles:
 *  - Token freshness (via ensureFreshToken)
 *  - HMAC-SHA256 request signing
 *  - 3x exponential-backoff retry on network errors and 5xx
 *  - 429 rate-limit back-off using Retry-After header
 */
async function request(shopId, method, path, queryParams = {}, body = null) {
  const account = await ensureFreshToken(shopId);

  const appKey = process.env.TIKTOK_APP_KEY;
  const appSecret = process.env.TIKTOK_APP_SECRET;

  // access_token is passed as a query param but excluded from signing per TikTok spec
  const signedParams = buildSignedParams(appSecret, appKey, path, queryParams);
  signedParams.access_token = account.accessToken;

  const url = `${API_BASE()}${path}?${new URLSearchParams(signedParams).toString()}`;

  const fetchOptions = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) fetchOptions.body = JSON.stringify(body);

  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      const res = await fetch(url, fetchOptions);

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10);
        await sleep(retryAfter * 1000);
        attempt++;
        continue;
      }

      if (res.status >= 500) {
        // Exponential back-off: 0ms, 1s, 3s
        const delays = [0, 1000, 3000];
        await sleep(delays[attempt] || 3000);
        attempt++;
        continue;
      }

      const data = await res.json();

      if (data.code !== 0) {
        await _logError(shopId, path, data.code, data.message);
        const err = new Error(data.message || `TikTok API error ${data.code}`);
        err.tiktokCode = data.code;
        err.status = 502;
        err.expose = true;
        throw err;
      }

      return data;
    } catch (err) {
      if (err.tiktokCode) throw err; // Already a TikTok API error, don't retry
      attempt++;
      if (attempt >= MAX_RETRIES) {
        await _logError(shopId, path, 'NETWORK', err.message);
        const wrapped = new Error(`TikTok request failed after ${MAX_RETRIES} attempts: ${err.message}`);
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

async function put(shopId, path, queryParams = {}, body = {}) {
  return request(shopId, 'PUT', path, queryParams, body);
}

async function _logError(shopId, path, code, message) {
  try {
    await TikTokSyncLog.create({
      shopId,
      operation: 'sync_products', // placeholder; callers log their own specific operation
      status: 'error',
      errorCode: String(code),
      errorMessage: message,
      meta: { path },
      triggeredBy: 'system',
    });
  } catch (_) {}
}

module.exports = { get, post, put };
