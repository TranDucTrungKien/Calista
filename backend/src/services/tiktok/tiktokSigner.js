const crypto = require('crypto');

/**
 * Signs a TikTok Shop API request using HMAC-SHA256.
 *
 * Algorithm:
 *   1. Remove keys: sign, access_token, and any File-type values
 *   2. Sort remaining param keys alphabetically
 *   3. Concatenate: appSecret + path + key1value1key2value2... + appSecret
 *   4. HMAC-SHA256(key=appSecret, data=concatenated) → uppercase hex
 */
function sign(appSecret, path, params) {
  const excludeKeys = new Set(['sign', 'access_token']);

  const sortedKeys = Object.keys(params)
    .filter((k) => !excludeKeys.has(k))
    .sort();

  let input = appSecret + path;
  for (const k of sortedKeys) {
    input += k + params[k];
  }
  input += appSecret;

  return crypto.createHmac('sha256', appSecret).update(input).digest('hex').toUpperCase();
}

/**
 * Builds a complete signed param object ready to be serialised as a query string.
 * Merges app_key, timestamp, sign_method, and sign into extraParams.
 */
function buildSignedParams(appSecret, appKey, path, extraParams = {}) {
  const params = {
    app_key: appKey,
    timestamp: Math.floor(Date.now() / 1000).toString(),
    sign_method: 'HMAC_SHA256',
    ...extraParams,
  };

  params.sign = sign(appSecret, path, params);
  return params;
}

module.exports = { sign, buildSignedParams };
