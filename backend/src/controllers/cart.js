const Cart = require('../models/cart');
const Product = require('../models/product');

async function getOrCreate(userId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) cart = await Cart.create({ userId, items: [] });
  return cart;
}

exports.get = async (req, res, next) => {
  try {
    const cart = await getOrCreate(req.user._id);
    res.json({ cart });
  } catch (err) {
    next(err);
  }
};

exports.add = async (req, res, next) => {
  try {
    const { productId, qty = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      const err = new Error('Sản phẩm không tồn tại');
      err.status = 404;
      err.expose = true;
      throw err;
    }
    const cart = await getOrCreate(req.user._id);
    const idx = cart.items.findIndex(
      (i) => i.productId.toString() === productId
    );
    if (idx >= 0) {
      cart.items[idx].qty += Number(qty);
    } else {
      cart.items.push({
        productId: product._id,
        qty: Number(qty),
        price: product.price,
        snapshot: {
          name: product.name,
          image: product.images[0] || '',
          slug: product.slug,
        },
      });
    }
    await cart.save();
    res.json({ cart });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { qty } = req.body;
    const cart = await getOrCreate(req.user._id);
    const item = cart.items.id(itemId);
    if (!item) {
      const err = new Error('Mục giỏ hàng không tồn tại');
      err.status = 404;
      err.expose = true;
      throw err;
    }
    item.qty = Math.max(1, Number(qty));
    await cart.save();
    res.json({ cart });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const cart = await getOrCreate(req.user._id);
    cart.items = cart.items.filter((i) => i._id.toString() !== itemId);
    await cart.save();
    res.json({ cart });
  } catch (err) {
    next(err);
  }
};

exports.clear = async (req, res, next) => {
  try {
    const cart = await getOrCreate(req.user._id);
    cart.items = [];
    await cart.save();
    res.json({ cart });
  } catch (err) {
    next(err);
  }
};

exports.merge = async (req, res, next) => {
  try {
    const { items = [] } = req.body;
    const cart = await getOrCreate(req.user._id);
    for (const it of items) {
      const product = await Product.findById(it.productId);
      if (!product || !product.isActive) continue;
      const idx = cart.items.findIndex(
        (i) => i.productId.toString() === String(it.productId)
      );
      if (idx >= 0) {
        cart.items[idx].qty += Number(it.qty || 1);
      } else {
        cart.items.push({
          productId: product._id,
          qty: Number(it.qty || 1),
          price: product.price,
          snapshot: {
            name: product.name,
            image: product.images[0] || '',
            slug: product.slug,
          },
        });
      }
    }
    await cart.save();
    res.json({ cart });
  } catch (err) {
    next(err);
  }
};
