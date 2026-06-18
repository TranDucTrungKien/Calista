const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Product = require('../models/product');

exports.me = async (req, res) => {
  res.json({ user: req.user });
};

exports.update = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, avatar },
      { new: true, runValidators: true }
    ).select('-passwordHash');
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      const err = new Error('Mật khẩu hiện tại không đúng');
      err.status = 400;
      err.expose = true;
      throw err;
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    next(err);
  }
};

exports.addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (req.body.isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }
    user.addresses.push(req.body);
    await user.save();
    res.json({ addresses: user.addresses });
  } catch (err) {
    next(err);
  }
};

exports.updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.params.addrId);
    if (!addr) {
      const err = new Error('Không tìm thấy địa chỉ');
      err.status = 404;
      err.expose = true;
      throw err;
    }
    if (req.body.isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }
    Object.assign(addr, req.body);
    await user.save();
    res.json({ addresses: user.addresses });
  } catch (err) {
    next(err);
  }
};

exports.removeAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(
      (a) => a._id.toString() !== req.params.addrId
    );
    await user.save();
    res.json({ addresses: user.addresses });
  } catch (err) {
    next(err);
  }
};

exports.getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      populate: { path: 'categories', select: 'name slug' },
    });
    res.json({ items: user.wishlist });
  } catch (err) {
    next(err);
  }
};

exports.toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error('Sản phẩm không tồn tại');
      err.status = 404;
      err.expose = true;
      throw err;
    }
    const user = await User.findById(req.user._id);
    const idx = user.wishlist.findIndex((id) => id.toString() === productId);
    let added;
    if (idx >= 0) {
      user.wishlist.splice(idx, 1);
      added = false;
    } else {
      user.wishlist.push(productId);
      added = true;
    }
    await user.save();
    res.json({ wishlist: user.wishlist, added });
  } catch (err) {
    next(err);
  }
};

exports.adminList = async (req, res, next) => {
  try {
    const items = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

exports.adminUpdateRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['customer', 'admin'].includes(role)) {
      const err = new Error('Quyền không hợp lệ');
      err.status = 400;
      err.expose = true;
      throw err;
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-passwordHash');
    res.json({ user });
  } catch (err) {
    next(err);
  }
};
