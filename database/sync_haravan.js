const path = require('path');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const products = require('./products.json');

const CATEGORY_MAP = {
  '7965043682bb318040e223d6': 'Tẩy trang',
  '84485decc34edf9de5d839e2': 'Nước cân bằng da',
  '204223af6e4ef69920278693': 'Sản phẩm trị mụn',
  '698cc69d856664045667a061': 'Kem dưỡng ẩm',
  '06c1f85a451e932c97556d73': 'Khác',
  'da842fc2a945de711c045f23': 'Sữa rửa mặt',
  '65df4451a9603bbaf66186af': 'Mặt nạ',
  'c66411bebf256c85ab427bfd': 'Tinh chất dưỡng',
  'e7fa74431968614557e30142': 'Tẩy tế bào chết',
  '87961a87a4e22f68afdcbf71': 'Xịt khoáng',
};

const BASE = 'https://apis.haravan.com/com';
const TOKEN = process.env.HARAVAN_TOKEN;

function toHaravanProduct(p) {
  const categoryName = CATEGORY_MAP[p.categories?.[0]] || 'Khác';
  const tags = [
    ...( p.tags || []),
    ...(p.skinTypes || []),
    categoryName,
  ].join(', ');

  return {
    product: {
      title: p.name,
      body_html: p.description?.replace(/\n/g, '<br>') || '',
      vendor: 'Calista',
      product_type: categoryName,
      tags,
      options: [{ name: 'Title' }],
      variants: [
        {
          title: 'Mặc định',
          option1: 'Mặc định',
          sku: p.sku || '',
          price: String(p.price),
          compare_at_price: p.comparePrice > 0 ? String(p.comparePrice) : undefined,
          inventory_quantity: p.stock || 0,
          inventory_management: 'haravan',
          fulfillment_service: 'manual',
        },
      ],
      images: (p.images || []).map((src) => ({ src })),
    },
  };
}

async function createProduct(payload) {
  const res = await fetch(`${BASE}/products.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data.product;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function syncAll() {
  const active = products.filter((p) => p.isActive !== false);
  console.log(`Syncing ${active.length} products to Haravan...\n`);

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < active.length; i++) {
    const p = active[i];
    try {
      const created = await createProduct(toHaravanProduct(p));
      console.log(`[${i + 1}/${active.length}] ✓ ${created.title} (id: ${created.id})`);
      ok++;
    } catch (err) {
      console.error(`[${i + 1}/${active.length}] ✗ ${p.name}: ${err.message}`);
      fail++;
    }
    // Haravan rate limit: ~2 req/s
    await sleep(600);
  }

  console.log(`\nDone. ${ok} thành công, ${fail} thất bại.`);
}

syncAll().catch(console.error);
