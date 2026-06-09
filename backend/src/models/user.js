const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    ward: { type: String, trim: true },
    district: { type: String, trim: true },
    province: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: false }
);

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    avatar: { type: String },
    addresses: { type: [AddressSchema], default: [] },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
      index: true,
    },
    wishlist: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true },
    ],
  },
  { timestamps: true }
);

UserSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', UserSchema);
