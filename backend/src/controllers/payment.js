const Order = require('../models/order');

exports.callback = async (req, res, next) => {
  try {
    const { orderCode, status, provider } = req.body;
    const order = await Order.findOne({ code: orderCode });
    if (!order) return res.json({ message: 'ignored' });
    if (status === 'success' || status === '1' || status === 0) {
      order.paymentStatus = 'Đã thanh toán';
      order.paidAt = new Date();
      order.statusHistory.push({
        status: order.orderStatus,
        note: `Đã thanh toán qua ${provider}`,
      });
      await order.save();
    } else {
      order.paymentStatus = 'Thất bại';
      await order.save();
    }
    res.json({ message: 'ok' });
  } catch (err) {
    next(err);
  }
};
