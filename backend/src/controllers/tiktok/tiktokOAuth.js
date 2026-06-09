const tiktokAuth = require('../../services/tiktok/tiktokAuth');
const TikTokAccount = require('../../models/tiktokAccount');

exports.initiateOAuth = async (req, res, next) => {
  try {
    const state = tiktokAuth.signOAuthState(req.user._id);
    const authUrl = tiktokAuth.getAuthorizationUrl(state);
    res.json({ authUrl });
  } catch (err) {
    next(err);
  }
};

exports.handleCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/admin/tiktok?error=missing_params`
      );
    }

    let decoded;
    try {
      decoded = tiktokAuth.verifyOAuthState(state);
    } catch (_) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/admin/tiktok?error=invalid_state`
      );
    }

    await tiktokAuth.exchangeCode(code, decoded.adminId);

    res.redirect(`${process.env.FRONTEND_URL}/admin/tiktok?connected=true`);
  } catch (err) {
    res.redirect(
      `${process.env.FRONTEND_URL}/admin/tiktok?error=${encodeURIComponent(err.message)}`
    );
  }
};

exports.disconnect = async (req, res, next) => {
  try {
    const account = await tiktokAuth.getConnectedAccount();
    if (!account) {
      const err = new Error('No connected TikTok Shop found');
      err.status = 404;
      err.expose = true;
      throw err;
    }
    await tiktokAuth.disconnectShop(account.shopId, req.user._id);
    res.json({ message: 'Đã ngắt kết nối TikTok Shop thành công' });
  } catch (err) {
    next(err);
  }
};

exports.getStatus = async (req, res, next) => {
  try {
    const account = await TikTokAccount.findOne({ isConnected: true })
      .select('-accessToken -refreshToken')
      .sort({ createdAt: -1 })
      .lean();

    if (!account) {
      return res.json({ isConnected: false });
    }

    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const refreshTokenWarning =
      Date.now() + thirtyDaysMs >= new Date(account.refreshTokenExpiresAt).getTime();

    res.json({ ...account, isConnected: true, refreshTokenWarning });
  } catch (err) {
    next(err);
  }
};
