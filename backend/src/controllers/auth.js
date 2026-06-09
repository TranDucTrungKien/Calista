const bcrypt = require('bcryptjs');
const User = require('../models/user');
const {
  signAccess,
  signRefresh,
  verifyRefresh,
  refreshCookieOptions,
} = require('../services/jwt');

function shape(user) {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    phone: user.phone || '',
    role: user.role,
    avatar: user.avatar || '',
    addresses: user.addresses || [],
    wishlist: user.wishlist || [],
  };
}

exports.register = async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body;
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      const err = new Error('Email đã được sử dụng');
      err.status = 409;
      err.expose = true;
      throw err;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      name,
      phone,
    });
    const accessToken = signAccess(user);
    const refreshToken = signRefresh(user);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions());
    res.status(201).json({ user: shape(user), accessToken });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const err = new Error('Email hoặc mật khẩu không đúng');
      err.status = 401;
      err.expose = true;
      throw err;
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      const err = new Error('Email hoặc mật khẩu không đúng');
      err.status = 401;
      err.expose = true;
      throw err;
    }
    const accessToken = signAccess(user);
    const refreshToken = signRefresh(user);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions());
    res.json({ user: shape(user), accessToken });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      const err = new Error('Phiên đã hết hạn, vui lòng đăng nhập lại');
      err.status = 401;
      err.expose = true;
      throw err;
    }
    const payload = verifyRefresh(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      const err = new Error('Tài khoản không tồn tại');
      err.status = 401;
      err.expose = true;
      throw err;
    }
    const accessToken = signAccess(user);
    res.json({ accessToken, user: shape(user) });
  } catch (err) {
    err.status = err.status || 401;
    err.expose = true;
    err.message = err.message || 'Phiên đã hết hạn';
    next(err);
  }
};

exports.logout = async (_req, res) => {
  res.clearCookie('refreshToken', { ...refreshCookieOptions(), maxAge: 0 });
  res.json({ message: 'Đăng xuất thành công' });
};

exports.me = async (req, res) => {
  res.json({ user: shape(req.user) });
};
