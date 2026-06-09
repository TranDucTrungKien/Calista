const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Category = require('../models/category');

const BASE = process.env.SITE_URL || 'https://calista.vn';

const STATIC_URLS = [
  { loc: `${BASE}/`, lastmod: '2026-06-04' },
  { loc: `${BASE}/san-pham`, lastmod: '2026-06-04' },
  { loc: `${BASE}/ve-chung-toi`, lastmod: '2026-06-04' },
  { loc: `${BASE}/lien-he`, lastmod: '2026-06-04' },
];

router.get('/sitemap.xml', async (_req, res) => {
  try {
    const [products, categories] = await Promise.all([
      Product.find({ isActive: true }, 'slug updatedAt').lean(),
      Category.find({}, 'slug updatedAt').lean(),
    ]);

    const productUrls = products.map((p) => ({
      loc: `${BASE}/san-pham/${p.slug}`,
      lastmod: p.updatedAt
        ? new Date(p.updatedAt).toISOString().split('T')[0]
        : '2026-06-04',
    }));

    const categoryUrls = categories.map((c) => ({
      loc: `${BASE}/san-pham?category=${c.slug}`,
      lastmod: c.updatedAt
        ? new Date(c.updatedAt).toISOString().split('T')[0]
        : '2026-06-04',
    }));

    const allUrls = [...STATIC_URLS, ...productUrls, ...categoryUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    res.status(500).json({ message: 'Sitemap generation failed', error: err.message });
  }
});

module.exports = router;
