const mongoose = require('mongoose');

const ORDER_STATUS = [
  'Chờ xác nhận',
  'Đã xác nhận',
  'Đang giao',
  'Đã giao',
  'Đã hủy',
];

const PAYMENT_METHOD = ['cod', 'momo', 'zalopay'];
const PAYMENT_STATUS = ['Chưa thanh toán', 'Đã thanh toán', 'Hoàn tiền', 'Thất bại'];

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    image: String,
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ShippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    ward: String,
    district: String,
    province: { type: String, required: true },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    paymentMethod: { type: String, enum: PAYMENT_METHOD, required: true },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS,
      default: 'Chưa thanh toán',
    },
    orderStatus: {
      type: String,
      enum: ORDER_STATUS,
      default: 'Chờ xác nhận',
      index: true,
    },
    statusHistory: [
      {
        status: String,
        at: { type: Date, default: Date.now },
        note: String,
      },
    ],
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    trackingNumber: String,
    note: String,
    paidAt: Date,
  },
  { timestamps: true }
);

OrderSchema.pre('save', function (next) {
  if (!this.code) {
    const stamp = Date.now().toString(36).toUpperCase();
    this.code = `CLT-${stamp}`;
  }
  next();
});

OrderSchema.statics.STATUS = ORDER_STATUS;
OrderSchema.statics.PAYMENT_METHOD = PAYMENT_METHOD;
OrderSchema.statics.PAYMENT_STATUS = PAYMENT_STATUS;

module.exports = mongoose.model('Order', OrderSchema);
