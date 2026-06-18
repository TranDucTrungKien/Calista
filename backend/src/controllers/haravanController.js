const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const haravan = require('../services/haravan');

// ─── Data mappers ─────────────────────────────────────────────────────────────

const SKIN_TYPES = new Set([
  'Da khô', 'Da dầu', 'Da hỗn hợp', 'Da nhạy cảm', 'Da thường', 'Mọi loại da',
]);

function mapProduct(h) {
  const variant = h.variants?.[0] || {};
  const allTags = (h.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
  const skinTypes = allTags.filter((t) => SKIN_TYPES.has(t));
  const tags = allTags.filter((t) => !SKIN_TYPES.has(t) && t !== h.product_type);

  return {
    _id: String(h.id),
    name: h.title || '',
    slug: h.handle || String(h.id),
    price: parseFloat(variant.price) || 0,
    comparePrice: parseFloat(variant.compare_at_price) || undefined,
    description: h.body_html || '',
    images: (h.images || []).map((img) => img.src).filter(Boolean),
    categories: h.product_type ? [h.product_type] : [],
    skinTypes,
    tags,
    stock: variant.inventory_quantity ?? 0,
    ratings: { avg: 0, count: 0 },
    isFeatured: allTags.some((t) => ['Nổi bật', 'featured', 'Feature'].includes(t)),
  };
}

function mapCategory(h) {
  return {
    _id: String(h.id),
    name: h.title || '',
    slug: h.handle || String(h.id),
    description: h.body_html || '',
    image: h.image?.src || '',
  };
}

function mapOrder(h) {
  const statusMap = {
    null_pending: 'Chờ xác nhận',
    null_paid: 'Đã xác nhận',
    fulfilled_paid: 'Đã giao',
    fulfilled_pending: 'Đang giao',
    null_voided: 'Đã hủy',
    null_refunded: 'Đã hủy',
  };
  const key = `${h.fulfillment_status || 'null'}_${h.financial_status || 'pending'}`;
  const orderStatus = statusMap[key] || 'Chờ xác nhận';

  return {
    _id: String(h.id),
    code: String(h.order_number || h.id),
    items: (h.line_items || []).map((li) => ({
      productId: String(li.product_id),
      name: li.name || li.title,
      image: li.image?.src || '',
      qty: li.quantity,
      price: parseFloat(li.price) || 0,
    })),
    shippingAddress: {
      fullName: h.shipping_address?.name || h.shipping_address?.first_name || '',
      phone: h.shipping_address?.phone || '',
      line1: h.shipping_address?.address1 || '',
      ward: h.shipping_address?.address2 || '',
      district: '',
      province: h.shipping_address?.city || h.shipping_address?.province || '',
    },
    paymentMethod: h.gateway || 'cod',
    paymentStatus: h.financial_status || 'pending',
    orderStatus,
    statusHistory: [{ status: orderStatus, at: h.created_at, note: '' }],
    subtotal: parseFloat(h.subtotal_price) || 0,
    shippingFee: parseFloat(h.shipping_lines?.[0]?.price) || 0,
    totalAmount: parseFloat(h.total_price) || 0,
    note: h.note || '',
    createdAt: h.created_at,
  };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    res.status(err.status || 502).json({ message: err.message });
  }
};

function issueTokens(customer) {
  const payload = {
    sub: String(customer.id),
    email: customer.email,
    name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
    role: (customer.tags || '').includes('admin') ? 'admin' : 'customer',
  };
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '7d',
  });
  const refreshToken = jwt.sign(
    { sub: String(customer.id) },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '30d' }
  );
  return { accessToken, refreshToken, payload };
}

// ─── Products ────────────────────────────────────────────────────────────────

exports.listProducts = handle(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 250);
  const page = Number(req.query.page) || 1;

  const params = { limit, page };
  if (req.query.q) params.title = req.query.q;
  // category param may be a Haravan collection ID (numeric) or a collection name string
  const cat = req.query.category;
  if (cat && /^\d+$/.test(cat)) {
    params.collection_id = cat;
  } else if (req.query.collection_id) {
    params.collection_id = req.query.collection_id;
  }

  const [productsData, countData] = await Promise.all([
    haravan.getProducts(params),
    haravan.countProducts(),
  ]);

  let products = (productsData.products || []).map(mapProduct);

  // filter by category name string (product_type) when non-numeric category is given
  if (cat && !/^\d+$/.test(cat)) {
    products = products.filter((p) =>
      p.categories.some((c) => c && c.toLowerCase() === cat.toLowerCase())
    );
  }

  // filter by skinType
  if (req.query.skinType) {
    products = products.filter((p) => p.skinTypes.includes(req.query.skinType));
  }

  // filter by tag
  if (req.query.tag) {
    products = products.filter((p) => p.tags.includes(req.query.tag));
  }

  // filter by price
  if (req.query.minPrice) {
    products = products.filter((p) => p.price >= Number(req.query.minPrice));
  }
  if (req.query.maxPrice) {
    products = products.filter((p) => p.price <= Number(req.query.maxPrice));
  }

  // featured filter
  if (req.query.featured === 'true') {
    products = products.filter((p) => p.isFeatured);
  }

  // sort
  if (req.query.sort === 'price_asc') products.sort((a, b) => a.price - b.price);
  else if (req.query.sort === 'price_desc') products.sort((a, b) => b.price - a.price);

  res.json({ items: products, total: countData.count || products.length, page, limit });
});

exports.countProducts = handle(async (_req, res) => {
  const data = await haravan.countProducts();
  res.json(data);
});

exports.getProduct = handle(async (req, res) => {
  const { idOrSlug } = req.params;
  let product;

  if (/^\d+$/.test(idOrSlug)) {
    const data = await haravan.getProduct(idOrSlug);
    product = data.product ? mapProduct(data.product) : null;
  } else {
    // lookup by handle (Haravan admin API supports ?handle= filter)
    const data = await haravan.getProducts({ limit: 1, handle: idOrSlug });
    const found = (data.products || [])[0];
    product = found ? mapProduct(found) : null;
  }

  if (!product) {
    return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
  }

  // related: same product_type, up to 8, exclude current
  const relatedData = await haravan.getProducts({ limit: 50 });
  const related = (relatedData.products || [])
    .filter((p) => p.handle !== product.slug && p.product_type === (product.categories[0] || ''))
    .slice(0, 8)
    .map(mapProduct);

  res.json({ product, related });
});

// ─── Collections / Categories ─────────────────────────────────────────────────

exports.listCategories = handle(async (_req, res) => {
  const data = await haravan.getCollections({ limit: 50 });
  const items = (data.custom_collections || []).map(mapCategory);
  res.json({ items });
});

exports.listCollections = handle(async (_req, res) => {
  const data = await haravan.getCollections({ limit: 50 });
  res.json(data);
});

exports.getCollection = handle(async (req, res) => {
  const data = await haravan.getCollection(req.params.id);
  res.json(data);
});

// ─── Current user (me) ───────────────────────────────────────────────────────

function formatCustomerUser(customer) {
  return {
    id: String(customer.id),
    email: customer.email,
    name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
    phone: customer.phone || '',
    role: (customer.tags || '').includes('admin') ? 'admin' : 'customer',
    addresses: (customer.addresses || []).map((a) => ({
      _id: String(a.id),
      fullName: a.name || `${a.first_name || ''} ${a.last_name || ''}`.trim(),
      phone: a.phone || '',
      line1: a.address1 || '',
      ward: a.address2 || '',
      district: '',
      province: a.city || a.province || '',
      isDefault: a.default || false,
    })),
  };
}

exports.getMe = handle(async (req, res) => {
  const data = await haravan.getCustomer(req.user.id);
  if (!data.customer) return res.status(404).json({ message: 'Tài khoản không tồn tại' });
  res.json({ user: formatCustomerUser(data.customer) });
});

exports.updateMe = handle(async (req, res) => {
  const { name, phone } = req.body;
  const nameParts = (name || '').trim().split(' ');
  const lastName = nameParts.pop() || '';
  const firstName = nameParts.join(' ') || lastName;

  const data = await haravan.updateCustomer(req.user.id, {
    first_name: firstName,
    last_name: lastName,
    phone: phone || '',
  });
  res.json({ user: formatCustomerUser(data.customer) });
});

exports.changePassword = handle(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const data = await haravan.getCustomer(req.user.id);
  const customer = data.customer;
  if (!customer) return res.status(404).json({ message: 'Tài khoản không tồn tại' });

  let note = {};
  try { note = JSON.parse(customer.note || '{}'); } catch { note = {}; }

  if (!note.pwHash || !(await bcrypt.compare(currentPassword, note.pwHash))) {
    return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
  }

  note.pwHash = await bcrypt.hash(newPassword, 10);
  await haravan.updateCustomer(req.user.id, { note: JSON.stringify(note) });
  res.json({ message: 'Đổi mật khẩu thành công' });
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

exports.register = handle(async (req, res) => {
  const { email, password, name, phone } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
  }

  // check existing
  const existing = await haravan.findCustomerByEmail(email);
  if ((existing.customers || []).length > 0) {
    return res.status(409).json({ message: 'Email đã được sử dụng' });
  }

  const pwHash = await bcrypt.hash(password, 10);
  const nameParts = name.trim().split(' ');
  const lastName = nameParts.pop() || '';
  const firstName = nameParts.join(' ') || lastName;

  const created = await haravan.createCustomer({
    first_name: firstName,
    last_name: lastName,
    email,
    phone: phone || '',
    note: JSON.stringify({ pwHash }),
    verified_email: true,
  });

  const customer = created.customer;
  if (!customer) {
    return res.status(502).json({ message: 'Tạo tài khoản thất bại' });
  }

  const { accessToken, refreshToken, payload } = issueTokens(customer);

  res
    .cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
    .json({
      accessToken,
      user: {
        id: payload.sub,
        email: customer.email,
        name: payload.name,
        role: payload.role,
        phone: customer.phone || '',
      },
    });
});

exports.login = handle(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
  }

  const data = await haravan.findCustomerByEmail(email);
  const customer = (data.customers || [])[0];
  if (!customer) {
    return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
  }

  let pwHash = '';
  try {
    const note = JSON.parse(customer.note || '{}');
    pwHash = note.pwHash || '';
  } catch {
    pwHash = '';
  }

  if (!pwHash || !(await bcrypt.compare(password, pwHash))) {
    return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
  }

  const { accessToken, refreshToken, payload } = issueTokens(customer);

  res
    .cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
    .json({
      accessToken,
      user: {
        id: payload.sub,
        email: customer.email,
        name: payload.name,
        role: payload.role,
        phone: customer.phone || '',
        addresses: (customer.addresses || []).map((a) => ({
          _id: String(a.id),
          fullName: a.name || `${a.first_name} ${a.last_name}`.trim(),
          phone: a.phone || '',
          line1: a.address1 || '',
          ward: a.address2 || '',
          district: '',
          province: a.city || a.province || '',
          isDefault: a.default || false,
        })),
      },
    });
});

exports.authRefresh = handle(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: 'Không có refresh token' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return res.status(401).json({ message: 'Refresh token hết hạn' });
  }

  const data = await haravan.getCustomer(payload.sub);
  const customer = data.customer;
  if (!customer) return res.status(401).json({ message: 'Tài khoản không tồn tại' });

  const { accessToken, refreshToken, payload: p } = issueTokens(customer);

  res
    .cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
    .json({
      accessToken,
      user: { id: p.sub, email: customer.email, name: p.name, role: p.role },
    });
});

exports.authLogout = (_req, res) => {
  res.clearCookie('refreshToken', { sameSite: 'none', secure: true }).json({ message: 'Đã đăng xuất' });
};

// ─── Orders (customer-facing) ────────────────────────────────────────────────

exports.createOrder = handle(async (req, res) => {
  const { shippingAddress, paymentMethod, note, items } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ message: 'Giỏ hàng trống' });
  }
  if (!shippingAddress) {
    return res.status(400).json({ message: 'Vui lòng nhập địa chỉ giao hàng' });
  }

  const lineItems = items.map((item) => ({
    product_id: /^\d+$/.test(item.productId) ? Number(item.productId) : undefined,
    title: item.snapshot?.name || item.name || '',
    quantity: item.qty,
    price: String(item.price),
    requires_shipping: true,
  }));

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const shippingFee = subtotal >= 500000 ? 0 : 30000;

  const nameParts = (shippingAddress.fullName || '').trim().split(' ');
  const lastName = nameParts.pop() || '';
  const firstName = nameParts.join(' ') || lastName;

  const orderData = {
    line_items: lineItems,
    customer: { id: Number(req.user.id) },
    shipping_address: {
      first_name: firstName,
      last_name: lastName,
      name: shippingAddress.fullName,
      phone: shippingAddress.phone,
      address1: shippingAddress.line1,
      address2: [shippingAddress.ward, shippingAddress.district].filter(Boolean).join(', '),
      city: shippingAddress.province,
      country: 'Vietnam',
    },
    gateway: paymentMethod || 'cod',
    financial_status: 'pending',
    note: note || '',
    shipping_lines: shippingFee > 0
      ? [{ price: String(shippingFee), title: 'Phí vận chuyển', code: 'standard' }]
      : [],
  };

  const created = await haravan.createOrder(orderData);
  const order = created.order;
  if (!order) return res.status(502).json({ message: 'Tạo đơn hàng thất bại' });

  res.json({
    order: mapOrder(order),
    payment: { provider: paymentMethod, payUrl: null },
  });
});

exports.listMyOrders = handle(async (req, res) => {
  const data = await haravan.getOrdersByCustomerId(req.user.id, {
    limit: Number(req.query.limit) || 20,
    page: Number(req.query.page) || 1,
  });
  const items = (data.orders || []).map(mapOrder);
  res.json({ items });
});

exports.getMyOrder = handle(async (req, res) => {
  const data = await haravan.getOrder(req.params.id);
  if (!data.order) return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
  res.json({ order: mapOrder(data.order) });
});

// ─── Admin Orders ─────────────────────────────────────────────────────────────

exports.listOrders = handle(async (req, res) => {
  const data = await haravan.getOrders({
    limit: Number(req.query.limit) || 50,
    page: Number(req.query.page) || 1,
    status: req.query.status || 'any',
  });
  const items = (data.orders || []).map(mapOrder);
  res.json({ items, total: items.length });
});

exports.countOrders = handle(async (req, res) => {
  const data = await haravan.countOrders({ status: req.query.status || 'any' });
  res.json(data);
});

exports.getOrder = handle(async (req, res) => {
  const data = await haravan.getOrder(req.params.id);
  res.json(data);
});

// ─── Admin Customers ──────────────────────────────────────────────────────────

exports.listCustomers = handle(async (req, res) => {
  const data = await haravan.getCustomers({
    limit: Number(req.query.limit) || 50,
    page: Number(req.query.page) || 1,
  });
  res.json(data);
});

exports.getCustomer = handle(async (req, res) => {
  const data = await haravan.getCustomer(req.params.id);
  res.json(data);
});
