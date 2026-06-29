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
    variantId: String(variant.id || ''),
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
      productId: li.product_id ? String(li.product_id) : '',
      name: li.name || li.title,
      image: li.image?.src || '',
      qty: li.quantity,
      price: parseFloat(li.price) || 0,
    })),
    shippingAddress: {
      fullName: h.shipping_address?.name || `${h.shipping_address?.first_name || ''} ${h.shipping_address?.last_name || ''}`.trim(),
      phone: h.shipping_address?.phone || '',
      line1: h.shipping_address?.address1 || '',
      ward: h.shipping_address?.address2 || '',
      district: h.shipping_address?.city || '',
      province: h.shipping_address?.province || '',
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
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const page = Number(req.query.page) || 1;

  // Always fetch full catalog for accurate in-memory filtering
  let rawProducts;
  if (req.query.q) {
    // Use Haravan title search for text queries (faster, server-side)
    const d = await haravan.getProducts({ limit: 50, title: req.query.q });
    rawProducts = d.products || [];
  } else {
    rawProducts = await haravan.getAllProducts();
  }

  let products = rawProducts.map(mapProduct);

  // category: use the category name as ID (derived from product_type)
  if (req.query.category) {
    const cat = req.query.category;
    products = products.filter((p) =>
      p.categories.some((c) => c && c === cat)
    );
  }

  if (req.query.skinType) {
    products = products.filter((p) => p.skinTypes.includes(req.query.skinType));
  }

  if (req.query.tag) {
    products = products.filter((p) => p.tags.includes(req.query.tag));
  }

  if (req.query.minPrice) {
    products = products.filter((p) => p.price >= Number(req.query.minPrice));
  }
  if (req.query.maxPrice) {
    products = products.filter((p) => p.price <= Number(req.query.maxPrice));
  }

  if (req.query.featured === 'true') {
    products = products.filter((p) => p.isFeatured);
  }

  if (req.query.sort === 'price_asc') products.sort((a, b) => a.price - b.price);
  else if (req.query.sort === 'price_desc') products.sort((a, b) => b.price - a.price);

  const total = products.length;
  const start = (page - 1) * limit;
  const items = products.slice(start, start + limit);

  res.json({ items, total, page, limit });
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

  // related: same product_type, up to 8, exclude current (fetch full catalog)
  const allRaw = await haravan.getAllProducts();
  const related = allRaw
    .filter((p) => p.handle !== product.slug && p.product_type === (product.categories[0] || ''))
    .slice(0, 8)
    .map(mapProduct);

  res.json({ product, related });
});

// ─── Collections / Categories ─────────────────────────────────────────────────

// Ordered list matching original MongoDB category order
const CATEGORY_ORDER = [
  'Sữa rửa mặt',
  'Tẩy trang',
  'Nước cân bằng da',
  'Tinh chất dưỡng',
  'Kem dưỡng ẩm',
  'Mặt nạ',
  'Tẩy tế bào chết',
  'Sản phẩm trị mụn',
  'Xịt khoáng',
  'Khác',
];

exports.listCategories = handle(async (_req, res) => {
  // Derive categories from product_type of actual products (not Haravan collections)
  const rawProducts = await haravan.getAllProducts();

  // Map: category name → first product image found
  const imageByCategory = {};
  rawProducts.forEach((p) => {
    const name = (p.product_type || '').trim();
    if (name && !imageByCategory[name]) {
      const img = (p.images || [])[0]?.src || '';
      if (img) imageByCategory[name] = img;
    }
  });

  const seen = new Set(Object.keys(imageByCategory));
  rawProducts.forEach((p) => {
    const name = (p.product_type || '').trim();
    if (name) seen.add(name);
  });

  // Sort by canonical order, then alphabetically for any extras
  const names = [...seen].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b, 'vi');
  });

  const items = names.map((name) => ({
    _id: name,   // use category name as ID — Angular passes it back for filtering
    name,
    slug: name,
    description: '',
    image: imageByCategory[name] || '',
  }));

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
      district: a.city || '',
      province: a.province || '',
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
  if (password.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu ít nhất 6 ký tự' });
  }

  const pwHash = await bcrypt.hash(password, 10);
  const nameParts = name.trim().split(' ');
  const lastName = nameParts.pop() || '';
  const firstName = nameParts.join(' ') || lastName;

  // Step 1: create customer (without note — Haravan may not save note on creation)
  let created;
  try {
    created = await haravan.createCustomer({
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || undefined,
    });
  } catch (err) {
    if (err.status === 422) {
      try {
        const body = JSON.parse(err.message.replace(/^Haravan \d+: /, ''));
        if (body?.errors?.email) {
          return res.status(409).json({ message: 'Email đã được sử dụng' });
        }
        const firstError = Object.values(body?.errors || {})[0];
        return res.status(400).json({ message: Array.isArray(firstError) ? firstError[0] : 'Dữ liệu không hợp lệ' });
      } catch {
        return res.status(409).json({ message: 'Email đã được sử dụng' });
      }
    }
    throw err;
  }

  const customer = created?.customer;
  if (!customer) {
    return res.status(502).json({ message: 'Tạo tài khoản thất bại' });
  }

  // Step 2: save password hash via update (more reliable than setting note on creation)
  await haravan.updateCustomer(customer.id, { note: JSON.stringify({ pwHash }) });

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

  // Search returns limited fields — fetch full customer by ID to get note
  const searchData = await haravan.findCustomerByEmail(email);
  const found = (searchData.customers || [])[0];
  if (!found) {
    return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
  }

  const fullData = await haravan.getCustomer(found.id);
  const customer = fullData.customer;
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
          fullName: a.name || `${a.first_name || ''} ${a.last_name || ''}`.trim(),
          phone: a.phone || '',
          line1: a.address1 || '',
          ward: a.address2 || '',
          district: a.city || '',
          province: a.province || '',
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

  const lineItems = items.map((item) => {
    const variantId = /^\d+$/.test(String(item.variantId)) ? Number(item.variantId) : null;
    const productId = /^\d+$/.test(String(item.productId)) ? Number(item.productId) : null;
    return {
      ...(variantId ? { variant_id: variantId } : { product_id: productId }),
      quantity: item.qty,
      price: String(item.price),
    };
  });

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
      name: shippingAddress.fullName || '',
      phone: shippingAddress.phone || '',
      address1: shippingAddress.line1 || '',
      address2: shippingAddress.ward || '',
      city: shippingAddress.district || '',
      province: shippingAddress.province || '',
      country: 'Vietnam',
      country_code: 'VN',
    },
    gateway: paymentMethod || 'cod',
    note: note || '',
    shipping_lines: shippingFee > 0
      ? [{ price: String(shippingFee), title: 'Phí vận chuyển', code: 'standard' }]
      : [],
  };

  console.log('[createOrder] payload:', JSON.stringify(orderData, null, 2));

  let created;
  try {
    created = await haravan.createOrder(orderData);
  } catch (err) {
    console.error('[createOrder] Haravan error:', err.message);
    // Parse Haravan validation errors into a readable message
    let msg = 'Tạo đơn hàng thất bại';
    try {
      const body = JSON.parse(err.message.replace(/^Haravan \d+:\s*/, ''));
      const errors = body.errors || body.error;
      if (errors) {
        const detail = typeof errors === 'string' ? errors
          : Object.entries(errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('; ');
        msg = detail;
      }
    } catch { /* ignore parse errors */ }
    return res.status(err.status || 502).json({ message: msg });
  }

  const order = created.order;
  if (!order) return res.status(502).json({ message: 'Tạo đơn hàng thất bại — Haravan không trả về dữ liệu' });

  console.log('[createOrder] success, order #', order.order_number);

  res.json({
    order: mapOrder(order),
    payment: { provider: paymentMethod, payUrl: null },
  });
});

// ─── Customer address management ─────────────────────────────────────────────

function mapAddress(a) {
  return {
    _id: String(a.id),
    fullName: a.name || `${a.first_name || ''} ${a.last_name || ''}`.trim(),
    phone: a.phone || '',
    line1: a.address1 || '',
    ward: a.address2 || '',
    district: a.city || '',
    province: a.province || '',
    isDefault: a.default || false,
  };
}

exports.addMyAddress = handle(async (req, res) => {
  const { fullName, phone, line1, ward, district, province, isDefault } = req.body;
  const nameParts = (fullName || '').trim().split(' ');
  const lastName = nameParts.pop() || '';
  const firstName = nameParts.join(' ') || lastName;

  await haravan.createCustomerAddress(req.user.id, {
    first_name: firstName,
    last_name: lastName,
    name: fullName || '',
    phone: phone || '',
    address1: line1 || '',
    address2: ward || '',
    city: district || '',
    province: province || '',
    country: 'Vietnam',
    country_code: 'VN',
  });

  const customerData = await haravan.getCustomer(req.user.id);
  const addresses = (customerData.customer?.addresses || []).map(mapAddress);

  if (isDefault && addresses.length) {
    const newest = addresses[addresses.length - 1];
    try { await haravan.createCustomerAddress(req.user.id, { id: newest._id, default: true }); } catch {}
  }

  res.json({ addresses });
});

exports.removeMyAddress = handle(async (req, res) => {
  await haravan.deleteCustomerAddress(req.user.id, req.params.addrId);
  const customerData = await haravan.getCustomer(req.user.id);
  const addresses = (customerData.customer?.addresses || []).map(mapAddress);
  res.json({ addresses });
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
