const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const ShopeeAccount = require('../../models/shopeeAccount');
const ShopeeSyncLog = require('../../models/shopeeSyncLog');
const { sign } = require('./shopeeSigner');

const BASE = () => process.env.SHOPEE_API_BASE || 'https://partner.shopeemobile.com';
const PARTNER_ID = () => parseInt(process.env.SHOPEE_PARTNER_ID, 10);
const PARTNER_KEY = () => process.env.SHOPEE_PARTNER_KEY;
const REDIRECT_URI = () => process.env.SHOPEE_REDIRECT_URI;
const REFRESH_MARGIN_MS = () =>
  parseInt(process.env.SHOPEE_TOKEN_REFRESH_MARGIN_MIN || '10', 10) * 60 * 1000;

const refreshInFlight = new Map();

/** Returns the Shopee OAuth authorization URL. */
function getAuthorizationUrl(state) {
  const path = '/api/v2/shop/auth_partner';
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign(PARTNER_KEY(), PARTNER_ID(), path, timestamp);

  const params = new URLSearchParams({
    partner_id: PARTNER_ID(),
    timestamp,
    sign: signature,
    redirect: `${REDIRECT_URI()}?state=${state}`,
  });

  return `${BASE()}${path}?${params.toString()}`;
}

/** Signs a short-lived state JWT to defend against CSRF. */
function signOAuthState(adminId) {
  return jwt.sign(
    { adminId: adminId.toString(), nonce: crypto.randomBytes(8).toString('hex') },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '10m' }
  );
}

function verifyOAuthState(state) {
  return jwt.verify(state, process.env.JWT_ACCESS_SECRET);
}

/** Exchanges auth code for access + refresh tokens. */
async function exchangeCode(code, shopId, adminUserId) {
  const path = '/api/v2/auth/token/get';
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign(PARTNER_KEY(), PARTNER_ID(), path, timestamp);

  const url = new URL(BASE() + path);
  url.searchParams.set('partner_id', PARTNER_ID());
  url.searchParams.set('timestamp', timestamp);
  url.searchParams.set('sign', signature);

  const start = Date.now();
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, shop_id: parseInt(shopId, 10), partner_id: PARTNER_ID() }),
  });
  const data = await res.json();

  if (data.error && data.error !== '') {
    await _log(shopId, 'oauth_connect', 'error', {
      errorCode: data.error,
      errorMessage: data.message,
      durationMs: Date.now() - start,
      triggeredBy: 'manual',
    });
    const err = new Error(data.message || 'Shopee OAuth exchange failed');
    err.status = 502;
    err.expose = true;
    throw err;
  }

  const now = Date.now();
  const accessTokenExpiresAt = new Date(now + (data.expire_in || 14400) * 1000);
  const refreshTokenExpiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000);

  const account = await ShopeeAccount.findOneAndUpdate(
    { shopId: parseInt(shopId, 10) },
    {
      shopId: parseInt(shopId, 10),
      partnerId: PARTNER_ID(),
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      isConnected: true,
      createdBy: adminUserId,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await _log(account.shopId, 'oauth_connect', 'success', {
    itemsAffected: 1,
    durationMs: Date.now() - start,
    triggeredBy: 'manual',
  });

  return account;
}

/** Refreshes an expired access token. */
async function refreshAccessToken(account) {
  const path = '/api/v2/auth/access_token/get';
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign(PARTNER_KEY(), PARTNER_ID(), path, timestamp);

  const url = new URL(BASE() + path);
  url.searchParams.set('partner_id', PARTNER_ID());
  url.searchParams.set('timestamp', timestamp);
  url.searchParams.set('sign', signature);

  const start = Date.now();
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refresh_token: account.refreshToken,
      shop_id: account.shopId,
      partner_id: PARTNER_ID(),
    }),
  });
  const data = await res.json();

  if (data.error && data.error !== '') {
    await ShopeeAccount.findOneAndUpdate({ shopId: account.shopId }, { isConnected: false });
    await _log(account.shopId, 'token_refresh', 'error', {
      errorCode: data.error,
      errorMessage: data.message,
      durationMs: Date.now() - start,
      triggeredBy: 'system',
    });
    const err = new Error(data.message || 'Shopee token refresh failed');
    err.status = 401;
    err.expose = true;
    throw err;
  }

  const now = Date.now();
  const updated = await ShopeeAccount.findOneAndUpdate(
    { shopId: account.shopId },
    {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      accessTokenExpiresAt: new Date(now + (data.expire_in || 14400) * 1000),
      refreshTokenExpiresAt: new Date(now + 30 * 24 * 60 * 60 * 1000),
    },
    { new: true }
  );

  await _log(account.shopId, 'token_refresh', 'success', {
    durationMs: Date.now() - start,
    triggeredBy: 'system',
  });

  return updated;
}

/** Returns a guaranteed-fresh account. Uses per-shop mutex. */
async function ensureFreshToken(shopId) {
  if (refreshInFlight.has(shopId)) return refreshInFlight.get(shopId);

  const account = await ShopeeAccount.findOne({ shopId, isConnected: true });
  if (!account) {
    const err = new Error('Shopee Shop chưa được kết nối');
    err.status = 503;
    err.expose = true;
    throw err;
  }

  const needsRefresh = Date.now() + REFRESH_MARGIN_MS() >= account.accessTokenExpiresAt.getTime();
  if (!needsRefresh) return account;

  const promise = refreshAccessToken(account).finally(() => refreshInFlight.delete(shopId));
  refreshInFlight.set(shopId, promise);
  return promise;
}

async function disconnectShop(shopId, adminUserId) {
  await ShopeeAccount.findOneAndUpdate({ shopId }, { isConnected: false });
  await _log(shopId, 'oauth_disconnect', 'success', {
    triggeredBy: 'manual',
    meta: { disconnectedBy: adminUserId?.toString() },
  });
}

async function getConnectedAccount() {
  return ShopeeAccount.findOne({ isConnected: true }).sort({ createdAt: -1 });
}

async function _log(shopId, operation, status, extra = {}) {
  try {
    await ShopeeSyncLog.create({ shopId, operation, status, ...extra });
  } catch (_) {}
}

module.exports = {
  getAuthorizationUrl,
  signOAuthState,
  verifyOAuthState,
  exchangeCode,
  refreshAccessToken,
  ensureFreshToken,
  disconnectShop,
  getConnectedAccount,
};
