const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    qty: { type: Number, required: true, min: 1, default: 1 },
    price: { type: Number, required: true, min: 0 },
    snapshot: {
      name: String,
      image: String,
      slug: String,
    },
  },
  { _id: true, timestamps: false }
);

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', CartSchema);
