const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const TikTokAccount = require('../../models/tiktokAccount');
const TikTokSyncLog = require('../../models/tiktokSyncLog');

const AUTH_BASE = () => process.env.TIKTOK_AUTH_BASE || 'https://auth.tiktok-shops.com';
const APP_KEY = () => process.env.TIKTOK_APP_KEY;
const APP_SECRET = () => process.env.TIKTOK_APP_SECRET;
const REDIRECT_URI = () => process.env.TIKTOK_REDIRECT_URI;
const REFRESH_MARGIN_MS = () =>
  parseInt(process.env.TIKTOK_TOKEN_REFRESH_MARGIN_MIN || '5', 10) * 60 * 1000;

// Per-shopId in-flight refresh mutex — prevents duplicate concurrent refresh calls
const refreshInFlight = new Map();

/** Returns the signed OAuth authorization URL for TikTok Shop. */
function getAuthorizationUrl(state) {
  const params = new URLSearchParams({
    app_key: APP_KEY(),
    state,
  });
  return `${AUTH_BASE()}/oauth/authorize?${params.toString()}`;
}

/** Signs a short-lived state JWT to defend against CSRF during OAuth flow. */
function signOAuthState(adminId) {
  return jwt.sign(
    { adminId: adminId.toString(), nonce: crypto.randomBytes(8).toString('hex') },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '10m' }
  );
}

/** Verifies and decodes the state JWT returned in the OAuth callback. */
function verifyOAuthState(state) {
  return jwt.verify(state, process.env.JWT_ACCESS_SECRET);
}

/** Exchanges an authorization code for access + refresh tokens, upserts TikTokAccount. */
async function exchangeCode(code, adminUserId) {
  const url = `${AUTH_BASE()}/api/v2/token/get`;
  const params = new URLSearchParams({
    app_key: APP_KEY(),
    app_secret: APP_SECRET(),
    auth_code: code,
    grant_type: 'authorized_code',
  });

  const start = Date.now();
  const res = await fetch(`${url}?${params.toString()}`, { method: 'GET' });
  const data = await res.json();

  if (data.code !== 0) {
    await _log('unknown', 'oauth_connect', 'error', {
      errorCode: String(data.code),
      errorMessage: data.message,
      durationMs: Date.now() - start,
      triggeredBy: 'manual',
    });
    const err = new Error(data.message || 'TikTok OAuth exchange failed');
    err.status = 502;
    err.expose = true;
    throw err;
  }

  const d = data.data;
  const now = Date.now();
  const accessTokenExpiresAt = new Date(now + d.access_token_expire_in * 1000);
  const refreshTokenExpiresAt = new Date(now + d.refresh_token_expire_in * 1000);

  const account = await TikTokAccount.findOneAndUpdate(
    { shopId: d.open_id },
    {
      shopId: d.open_id,
      shopName: d.seller_name || '',
      appKey: APP_KEY(),
      accessToken: d.access_token,
      refreshToken: d.refresh_token,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      openId: d.open_id,
      sellerId: d.seller_id || '',
      scope: d.scope || '',
      isConnected: true,
      createdBy: adminUserId,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await _log(account.shopId, 'oauth_connect', 'success', {
    itemsAffected: 1,
    durationMs: Date.now() - start,
    triggeredBy: 'manual',
    meta: { shopName: account.shopName },
  });

  return account;
}

/** Refreshes an expired (or nearly expired) access token. Updates DB. */
async function refreshAccessToken(account) {
  const url = `${AUTH_BASE()}/api/v2/token/refresh`;
  const params = new URLSearchParams({
    app_key: APP_KEY(),
    app_secret: APP_SECRET(),
    refresh_token: account.refreshToken,
    grant_type: 'refresh_token',
  });

  const start = Date.now();
  const res = await fetch(`${url}?${params.toString()}`, { method: 'GET' });
  const data = await res.json();

  if (data.code !== 0) {
    // Refresh token itself has expired — force disconnect
    if (data.code === 40006 || data.code === 40007) {
      await TikTokAccount.findOneAndUpdate(
        { shopId: account.shopId },
        { isConnected: false }
      );
    }
    await _log(account.shopId, 'token_refresh', 'error', {
      errorCode: String(data.code),
      errorMessage: data.message,
      durationMs: Date.now() - start,
      triggeredBy: 'system',
    });
    const err = new Error(
      data.code === 40006 || data.code === 40007
        ? 'Refresh token expired — please reconnect TikTok Shop'
        : data.message || 'Token refresh failed'
    );
    err.status = data.code === 40006 || data.code === 40007 ? 401 : 502;
    err.expose = true;
    throw err;
  }

  const d = data.data;
  const now = Date.now();
  const updated = await TikTokAccount.findOneAndUpdate(
    { shopId: account.shopId },
    {
      accessToken: d.access_token,
      refreshToken: d.refresh_token,
      accessTokenExpiresAt: new Date(now + d.access_token_expire_in * 1000),
      refreshTokenExpiresAt: new Date(now + d.refresh_token_expire_in * 1000),
    },
    { new: true }
  );

  await _log(account.shopId, 'token_refresh', 'success', {
    durationMs: Date.now() - start,
    triggeredBy: 'system',
  });

  return updated;
}

/**
 * Returns a TikTokAccount with a guaranteed-fresh access token.
 * Uses a per-shopId mutex to prevent duplicate concurrent refreshes.
 */
async function ensureFreshToken(shopId) {
  if (refreshInFlight.has(shopId)) {
    return refreshInFlight.get(shopId);
  }

  const account = await TikTokAccount.findOne({ shopId, isConnected: true });
  if (!account) {
    const err = new Error('TikTok Shop not connected');
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

/** Marks a shop as disconnected without deleting token history. */
async function disconnectShop(shopId, adminUserId) {
  await TikTokAccount.findOneAndUpdate({ shopId }, { isConnected: false });
  await _log(shopId, 'oauth_disconnect', 'success', {
    triggeredBy: 'manual',
    meta: { disconnectedBy: adminUserId?.toString() },
  });
}

/** Convenience: returns the first connected account (single-shop setup). */
async function getConnectedAccount() {
  return TikTokAccount.findOne({ isConnected: true }).sort({ createdAt: -1 });
}

async function _log(shopId, operation, status, extra = {}) {
  try {
    await TikTokSyncLog.create({ shopId, operation, status, ...extra });
  } catch (_) {
    // Logging must never crash the main flow
  }
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
