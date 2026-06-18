const shopeeAuth = require('../../services/shopee/shopeeAuth');
const ShopeeAccount = require('../../models/shopeeAccount');

exports.initiateOAuth = async (req, res, next) => {
  try {
    const state = shopeeAuth.signOAuthState(req.user._id);
    const authUrl = shopeeAuth.getAuthorizationUrl(state);
    res.json({ authUrl });
  } catch (err) {
    next(err);
  }
};

exports.handleCallback = async (req, res, next) => {
  try {
    const { code, shop_id, state } = req.query;

    if (!code || !shop_id) {
      return res.redirect(`${process.env.FRONTEND_URL}/admin/shopee?error=missing_params`);
    }

    if (state) {
      try {
        shopeeAuth.verifyOAuthState(state);
      } catch (_) {
        return res.redirect(`${process.env.FRONTEND_URL}/admin/shopee?error=invalid_state`);
      }
    }

    await shopeeAuth.exchangeCode(code, shop_id, req.query.adminId);

    res.redirect(`${process.env.FRONTEND_URL}/admin/shopee?connected=true`);
  } catch (err) {
    res.redirect(
      `${process.env.FRONTEND_URL}/admin/shopee?error=${encodeURIComponent(err.message)}`
    );
  }
};

exports.disconnect = async (req, res, next) => {
  try {
    const account = await shopeeAuth.getConnectedAccount();
    if (!account) {
      const err = new Error('Không tìm thấy Shopee Shop đang kết nối');
      err.status = 404;
      err.expose = true;
      throw err;
    }
    await shopeeAuth.disconnectShop(account.shopId, req.user._id);
    res.json({ message: 'Đã ngắt kết nối Shopee Shop thành công' });
  } catch (err) {
    next(err);
  }
};

exports.getStatus = async (req, res, next) => {
  try {
    const account = await ShopeeAccount.findOne({ isConnected: true })
      .select('-accessToken -refreshToken')
      .sort({ createdAt: -1 })
      .lean();

    if (!account) return res.json({ isConnected: false });

    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const refreshTokenWarning =
      Date.now() + thirtyDaysMs >= new Date(account.refreshTokenExpiresAt).getTime();

    res.json({ ...account, isConnected: true, refreshTokenWarning });
  } catch (err) {
    next(err);
  }
};
