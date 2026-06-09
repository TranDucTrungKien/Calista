const Order = require('../models/order');
const Cart = require('../models/cart');
const Product = require('../models/product');
const { createPayment } = require('../services/payment');
const { sendMail } = require('../services/email');

function calcShipping(subtotal) {
  if (subtotal >= 500000) return 0;
  return 30000;
}

exports.create = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod = 'cod', note = '', items: bodyItems } =
      req.body;

    let items = bodyItems;
    if (!items || items.length === 0) {
      const cart = await Cart.findOne({ userId: req.user._id });
      if (!cart || cart.items.length === 0) {
        const err = new Error('Giỏ hàng trống');
        err.status = 400;
        err.expose = true;
        throw err;
      }
      items = cart.items.map((i) => ({
        productId: i.productId,
        qty: i.qty,
      }));
    }

    const products = await Product.find({
      _id: { $in: items.map((i) => i.productId) },
    });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const orderItems = [];
    let subtotal = 0;
    for (const i of items) {
      const p = productMap.get(String(i.productId));
      if (!p || !p.isActive) {
        const err = new Error('Sản phẩm không khả dụng');
        err.status = 400;
        err.expose = true;
        throw err;
      }
      if (p.stock < i.qty) {
        const err = new Error(`Sản phẩm "${p.name}" không đủ hàng`);
        err.status = 400;
        err.expose = true;
        throw err;
      }
      orderItems.push({
        productId: p._id,
        name: p.name,
        image: p.images[0] || '',
        qty: i.qty,
        price: p.price,
      });
      subtotal += p.price * i.qty;
    }

    const shippingFee = calcShipping(subtotal);
    const totalAmount = subtotal + shippingFee;

    const order = await Order.create({
      userId: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingFee,
      totalAmount,
      note,
      statusHistory: [{ status: 'Chờ xác nhận', note: 'Khách đặt đơn' }],
    });

    for (const it of orderItems) {
      await Product.findByIdAndUpdate(it.productId, {
        $inc: { stock: -it.qty },
      });
    }
    await Cart.findOneAndUpdate({ userId: req.user._id }, { items: [] });

    let payment = { provider: paymentMethod, payUrl: null };
    if (paymentMethod === 'momo' || paymentMethod === 'zalopay') {
      payment = await createPayment({ provider: paymentMethod, order });
    }

    sendMail({
      to: req.user.email,
      subject: `[Calista] Xác nhận đơn hàng ${order.code}`,
      html: `<p>Xin chào ${req.user.name},</p>
        <p>Cảm ơn bạn đã đặt hàng tại Calista. Mã đơn hàng của bạn là <b>${order.code}</b>.</p>
        <p>Tổng tiền: <b>${totalAmount.toLocaleString('vi-VN')}đ</b></p>`,
    }).catch(() => {});

    res.status(201).json({ order, payment });
  } catch (err) {
    next(err);
  }
};

exports.listMine = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ items: orders });
  } catch (err) {
    next(err);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      const err = new Error('Không tìm thấy đơn hàng');
      err.status = 404;
      err.expose = true;
      throw err;
    }
    if (
      order.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      const err = new Error('Không có quyền xem đơn hàng');
      err.status = 403;
      err.expose = true;
      throw err;
    }
    res.json({ order });
  } catch (err) {
    next(err);
  }
};

exports.adminList = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.orderStatus = status;
    const lim = Math.min(Number(limit), 100);
    const pg = Math.max(Number(page), 1);
    const [items, total] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip((pg - 1) * lim)
        .limit(lim),
      Order.countDocuments(filter),
    ]);
    res.json({ items, total, page: pg, limit: lim });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!Order.STATUS.includes(status)) {
      const err = new Error('Trạng thái không hợp lệ');
      err.status = 400;
      err.expose = true;
      throw err;
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      const err = new Error('Không tìm thấy đơn hàng');
      err.status = 404;
      err.expose = true;
      throw err;
    }
    order.orderStatus = status;
    order.statusHistory.push({ status, note });
    if (status === 'Đã hủy') {
      for (const it of order.items) {
        await Product.findByIdAndUpdate(it.productId, {
          $inc: { stock: it.qty },
        });
      }
    }
    if (status === 'Đã giao') {
      order.paymentStatus = 'Đã thanh toán';
      order.paidAt = new Date();
    }
    await order.save();
    res.json({ order });
  } catch (err) {
    next(err);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      const err = new Error('Không tìm thấy đơn hàng');
      err.status = 404;
      err.expose = true;
      throw err;
    }
    if (order.userId.toString() !== req.user._id.toString()) {
      const err = new Error('Không có quyền hủy đơn này');
      err.status = 403;
      err.expose = true;
      throw err;
    }
    if (order.orderStatus !== 'Chờ xác nhận') {
      const err = new Error('Đơn hàng không thể hủy ở trạng thái hiện tại');
      err.status = 400;
      err.expose = true;
      throw err;
    }
    order.orderStatus = 'Đã hủy';
    order.statusHistory.push({ status: 'Đã hủy', note: 'Khách tự hủy' });
    for (const it of order.items) {
      await Product.findByIdAndUpdate(it.productId, {
        $inc: { stock: it.qty },
      });
    }
    await order.save();
    res.json({ order });
  } catch (err) {
    next(err);
  }
};
