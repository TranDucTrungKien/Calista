const BASE = 'https://apis.haravan.com/com';

async function haravanFetch(path, options = {}) {
  const token = process.env.HARAVAN_TOKEN;
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw Object.assign(new Error(`Haravan ${res.status}: ${text}`), { status: res.status });
  }
  return res.json();
}

// ─── Products ────────────────────────────────────────────────────────────────

exports.getProducts = ({ limit = 50, page = 1, title, handle, collection_id } = {}) => {
  const params = new URLSearchParams({ limit, page });
  if (title) params.set('title', title);
  if (handle) params.set('handle', handle);
  if (collection_id) params.set('collection_id', collection_id);
  return haravanFetch(`/products.json?${params}`);
};

exports.getProduct = (id) => haravanFetch(`/products/${id}.json`);

// Fetches ALL products across multiple pages (Haravan max 50/page)
exports.getAllProducts = async () => {
  const first = await exports.getProducts({ limit: 50, page: 1 });
  const all = [...(first.products || [])];
  const total = first.count ?? all.length;
  const pages = Math.ceil(total / 50);
  if (pages > 1) {
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, i) =>
        exports.getProducts({ limit: 50, page: i + 2 })
      )
    );
    rest.forEach((r) => all.push(...(r.products || [])));
  }
  return all;
};

exports.countProducts = () => haravanFetch('/products/count.json');

// ─── Collections ─────────────────────────────────────────────────────────────

exports.getCollections = ({ limit = 50 } = {}) =>
  haravanFetch(`/custom_collections.json?limit=${limit}`);

exports.getCollection = (id) => haravanFetch(`/custom_collections/${id}.json`);

// ─── Orders ──────────────────────────────────────────────────────────────────

exports.getOrders = ({ limit = 50, page = 1, status = 'any' } = {}) => {
  const params = new URLSearchParams({ limit, page, status });
  return haravanFetch(`/orders.json?${params}`);
};

exports.getOrder = (id) => haravanFetch(`/orders/${id}.json`);

exports.countOrders = ({ status = 'any' } = {}) =>
  haravanFetch(`/orders/count.json?status=${status}`);

// ─── Customers ───────────────────────────────────────────────────────────────

exports.getCustomers = ({ limit = 50, page = 1 } = {}) =>
  haravanFetch(`/customers.json?limit=${limit}&page=${page}`);

exports.getCustomer = (id) => haravanFetch(`/customers/${id}.json`);

// Try both search methods; whichever returns a customer with matching email wins
exports.findCustomerByEmail = async (email) => {
  // Method 1: search endpoint
  try {
    const r1 = await haravanFetch(`/customers/search.json?query=email:${encodeURIComponent(email)}&limit=1`);
    const exact1 = (r1.customers || []).filter((c) => c.email === email);
    if (exact1.length) return { customers: exact1 };
  } catch {}
  // Method 2: filter with ?email=
  const r2 = await haravanFetch(`/customers.json?email=${encodeURIComponent(email)}&limit=50`);
  const exact2 = (r2.customers || []).filter((c) => c.email === email);
  return { customers: exact2 };
};

exports.createCustomer = (data) =>
  haravanFetch('/customers.json', {
    method: 'POST',
    body: JSON.stringify({ customer: data }),
  });

exports.updateCustomer = (id, data) =>
  haravanFetch(`/customers/${id}.json`, {
    method: 'PUT',
    body: JSON.stringify({ customer: data }),
  });

// ─── Orders (create + list by customer) ──────────────────────────────────────

exports.createOrder = (data) =>
  haravanFetch('/orders.json', {
    method: 'POST',
    body: JSON.stringify({ order: data }),
  });

exports.getOrdersByCustomerId = (customerId, { limit = 20, page = 1 } = {}) => {
  const params = new URLSearchParams({ limit, page, customer_id: String(customerId) });
  return haravanFetch(`/orders.json?${params}`);
};
