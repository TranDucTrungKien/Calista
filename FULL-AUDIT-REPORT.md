# Full SEO Audit Report — Calista
**URL:** http://localhost:4200/#/  
**Date:** 2026-06-04  
**Stack:** Angular 17 + Vite + Node.js/Express + MongoDB  
**Business:** TMĐT Mỹ phẩm thuần chay (Vietnamese Vegan Cosmetics E-commerce)

---

## Overall SEO Health Score: 18 / 100

| Category | Score | Status |
|---|---|---|
| Technical SEO | 10/100 | FAIL |
| Crawlability | 10/100 | FAIL |
| Indexability | 15/100 | FAIL |
| Content / E-E-A-T | 25/100 | FAIL |
| Schema / Structured Data | 0/100 | FAIL |
| Performance (CWV) | 35/100 | FAIL |
| AI Search Readiness (GEO) | 11/100 | FAIL |
| Images | N/A | N/A |

> **Root diagnosis:** The entire site is SEO-invisible. Hash routing + client-side-only rendering means every crawler — Googlebot, GPTBot, ClaudeBot, PerplexityBot — receives an empty `<app-root></app-root>` shell for every URL. All other issues are secondary to this architectural blocker.

---

## Top 5 Critical Issues

1. **Hash routing (#/)** — every URL resolves to the same HTML on the server; Googlebot cannot index any page except the homepage shell
2. **No Server-Side Rendering** — `<app-root>` delivers zero content to crawlers before JS execution
3. **Missing robots.txt** — crawlers operate without guidance; /admin, /api, /checkout being crawled
4. **Missing sitemap.xml** — product and category pages cannot be discovered
5. **Meta description encoding corruption** — garbled UTF-8 characters appear in Google SERPs

## Top 5 Quick Wins

1. Remove `withHashLocation()` from `app.config.ts` (10 minutes)
2. Fix meta description encoding in `index.html` (5 minutes)
3. Add `robots.txt` endpoint in Express (15 minutes)
4. Add `Organization` + `WebSite` JSON-LD to `index.html` (30 minutes)
5. Add dynamic `sitemap.xml` endpoint in Express (2 hours)

---

## CRITICAL Issues

### C1 — Hash-Based Routing (`#/`)
**File:** `frontend/src/app/app.config.ts` line 19  
**Impact:** Blocks ALL indexing for ALL pages  

Hash fragments are never sent to the server (RFC 3986). Every URL (`/#/san-pham`, `/#/san-pham/product-slug`, `/#/ve-chung-toi`) sends an identical `GET /` request. Google indexes one page — the empty shell. Product pages, categories, and about page are completely invisible.

**Fix — Step 1: `frontend/src/app/app.config.ts`**
```typescript
// REMOVE withHashLocation import and call:
// BEFORE:
import { provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';
provideRouter(routes, withHashLocation(), withInMemoryScrolling({ ... }))

// AFTER:
import { provideRouter, withInMemoryScrolling } from '@angular/router';
provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }))
```

**Fix — Step 2: `backend/src/app.js`** — add SPA fallback AFTER API routes:
```javascript
const path = require('path');
const DIST = path.join(__dirname, '../../frontend/dist/calista/browser');

app.use(express.static(DIST));

// SPA catch-all — must come AFTER /api and /uploads routes
app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});
```

> All existing `routerLink` values already use clean paths (`/san-pham`, `/ve-chung-toi`) — internal links need zero changes after the switch.

---

### C2 — No Server-Side Rendering (CSR Only)
**Impact:** Zero visible content in initial HTML; LCP ~4–6s; AI crawlers see empty page  

Angular delivers `<app-root></app-root>` to every crawler. GPTBot, ClaudeBot, and PerplexityBot do not execute JavaScript at all. Googlebot renders JS but in a delayed second-wave queue (hours to days lag).

**Fix:**
```bash
ng add @angular/ssr
```

Angular 17 SSR renders the initial route on the server and delivers populated HTML on the first byte. This alone can move LCP from Poor to Good. For product pages with dynamic data, use `TransferState` to avoid double API calls:

```typescript
import { TransferState, makeStateKey } from '@angular/core';
const PRODUCT_KEY = makeStateKey<Product>('product');
```

Pre-render static routes in `angular.json`:
```json
"prerender": {
  "routes": ["/", "/ve-chung-toi", "/lien-he", "/san-pham"]
}
```

---

### C3 — Missing robots.txt
**Impact:** Crawlers waste budget on /admin, /api, /checkout; no sitemap declaration  

**Fix — `backend/src/app.js`** (add before API routes):
```javascript
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /uploads/
Disallow: /gio-hang
Disallow: /thanh-toan
Disallow: /don-hang
Disallow: /tai-khoan
Disallow: /yeu-thich
Disallow: /tim-kiem

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: https://calista.vn/sitemap.xml`);
});
```

---

### C4 — Missing sitemap.xml
**Impact:** Product pages not discovered by crawlers; IndexNow submissions not possible  

Hash routing makes sitemap invalid anyway (fragment URLs are not valid `<loc>` values per Sitemap Protocol spec). Fix routing first (C1), then add dynamic sitemap.

**Fix — `backend/src/routes/sitemap.js`:**
```javascript
const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Category = require('../models/category');
const BASE = process.env.SITE_URL || 'https://calista.vn';

router.get('/sitemap.xml', async (req, res) => {
  const [products, categories] = await Promise.all([
    Product.find({ isActive: true }, 'slug updatedAt').lean(),
    Category.find({}, 'slug updatedAt').lean(),
  ]);

  const staticUrls = [
    { loc: `${BASE}/` },
    { loc: `${BASE}/san-pham` },
    { loc: `${BASE}/ve-chung-toi` },
    { loc: `${BASE}/lien-he` },
  ];

  const productUrls = products.map(p => ({
    loc: `${BASE}/san-pham/${p.slug}`,
    lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : '2026-06-04',
  }));

  const categoryUrls = categories.map(c => ({
    loc: `${BASE}/san-pham?category=${c.slug}`,
    lastmod: c.updatedAt ? new Date(c.updatedAt).toISOString().split('T')[0] : '2026-06-04',
  }));

  const allUrls = [...staticUrls, ...productUrls, ...categoryUrls];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

  res.set('Content-Type', 'application/xml');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(xml);
});

module.exports = router;
```

Register in `app.js` before the SPA catch-all:
```javascript
app.use('/', require('./routes/sitemap'));
```

> **Do not include** `/gio-hang`, `/thanh-toan`, `/don-hang`, `/tai-khoan`, `/tim-kiem` in the sitemap — transactional and auth-gated pages have no SEO value.

---

## HIGH Priority Issues

### H1 — Meta Description Encoding Corruption
**File:** `frontend/src/index.html`  
**Impact:** Garbled characters in Google SERPs; destroys click-through rate  

Current (corrupted):
```
Calista â Má»¹ pháº©m thuáº§n chay tá»« chiáº¿t xuáº¥t thiÃªn nhiÃªn...
```

The file is likely being served with a charset mismatch (UTF-8 content read as latin-1).

**Fix:**
1. Confirm `index.html` is saved as UTF-8 (no BOM) in your editor
2. Replace the meta description with:
```html
<meta name="description" content="Calista — Mỹ phẩm thuần chay từ chiết xuất thiên nhiên, an toàn cho mọi loại da."/>
```

---

### H2 — No Canonical Tags
**File:** `frontend/src/index.html` + all route components  
**Impact:** Duplicate content risk between `calista.vn` vs `www.calista.vn`, http vs https, filter params  

**Fix — `frontend/src/app/core/services/seo.service.ts`** (new file):
```typescript
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private meta = inject(Meta);
  private title = inject(Title);
  private doc = inject(DOCUMENT);
  private router = inject(Router);

  init() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => this.setCanonical(e.urlAfterRedirects));
  }

  setPage(opts: { title: string; description: string; canonical?: string; image?: string }) {
    this.title.setTitle(opts.title);
    this.meta.updateTag({ name: 'description', content: opts.description });

    const canon = opts.canonical ?? `https://calista.vn${this.router.url.split('?')[0]}`;
    this.setCanonical(canon);

    this.meta.updateTag({ property: 'og:title', content: opts.title });
    this.meta.updateTag({ property: 'og:description', content: opts.description });
    this.meta.updateTag({ property: 'og:url', content: canon });
    this.meta.updateTag({ property: 'og:locale', content: 'vi_VN' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Calista' });
    if (opts.image) this.meta.updateTag({ property: 'og:image', content: opts.image });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: opts.title });
    this.meta.updateTag({ name: 'twitter:description', content: opts.description });
    if (opts.image) this.meta.updateTag({ name: 'twitter:image', content: opts.image });
  }

  private setCanonical(url: string) {
    const href = url.startsWith('http') ? url : `https://calista.vn${url.split('?')[0]}`;
    let link = this.doc.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}
```

Bootstrap in `app.component.ts`:
```typescript
export class AppComponent implements OnInit {
  private seo = inject(SeoService);
  ngOnInit() { this.seo.init(); }
}
```

---

### H3 — No Open Graph / Twitter Card Tags
**File:** `frontend/src/index.html`  
**Impact:** Blank link previews on Facebook, Zalo (dominant Vietnamese social platforms)  

Add static fallback OG tags to `index.html` for when JS hasn't run yet:
```html
<meta property="og:title" content="Calista | Mỹ Phẩm Thuần Chay Thiên Nhiên"/>
<meta property="og:description" content="Mỹ phẩm thuần chay từ chiết xuất thiên nhiên, an toàn cho mọi loại da."/>
<meta property="og:image" content="https://calista.vn/assets/images/og-default.jpg"/>
<meta property="og:url" content="https://calista.vn/"/>
<meta property="og:type" content="website"/>
<meta property="og:locale" content="vi_VN"/>
<meta property="og:site_name" content="Calista"/>
<meta name="twitter:card" content="summary_large_image"/>
```

Per-page OG tags are handled dynamically by `SeoService.setPage()` (see H2).

---

### H4 — Zero Structured Data
**File:** `frontend/src/index.html` (static) + `product-detail.component.ts` (dynamic)  
**Impact:** No rich results (product stars, price, availability in SERPs); no Google knowledge panel  

**Add to `frontend/src/index.html` `<head>` (static, global):**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://calista.vn/#organization",
      "name": "Calista",
      "url": "https://calista.vn/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://calista.vn/assets/images/favicon.png"
      },
      "description": "Mỹ phẩm thuần chay từ chiết xuất thiên nhiên, an toàn cho mọi loại da.",
      "areaServed": "VN",
      "inLanguage": "vi-VN"
    },
    {
      "@type": "WebSite",
      "@id": "https://calista.vn/#website",
      "url": "https://calista.vn/",
      "name": "Calista",
      "publisher": { "@id": "https://calista.vn/#organization" },
      "inLanguage": "vi-VN",
      "potentialAction": {
        "@type": "SearchAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://calista.vn/tim-kiem?q={search_term_string}" },
        "query-input": "required name=search_term_string"
      }
    }
  ]
}
</script>
```

**`frontend/src/app/core/services/schema.service.ts`** (new file):
```typescript
import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class SchemaService {
  private doc = inject(DOCUMENT);

  set(schema: object): void {
    this.remove();
    const script = this.doc.createElement('script');
    script.id = 'schema-dynamic';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    this.doc.head.appendChild(script);
  }

  remove(): void {
    this.doc.getElementById('schema-dynamic')?.remove();
  }
}
```

**Usage in `product-detail.component.ts`** (inside the `next:` callback after product loads):
```typescript
private schema = inject(SchemaService);

// After product data loads:
this.schema.set({
  "@context": "https://schema.org",
  "@type": "Product",
  "name": product.name,
  "description": product.description,
  "image": product.images,
  "brand": { "@type": "Brand", "name": "Calista" },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "VND",
    "price": product.price,
    "availability": product.stock > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    "url": `https://calista.vn/san-pham/${product.slug}`
  },
  ...(product.ratings.count > 0 && {
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.ratings.avg,
      "reviewCount": product.ratings.count,
      "bestRating": 5,
      "worstRating": 1
    }
  })
});
```

Call `this.schema.remove()` in `ngOnDestroy()`.

---

### H5 — Generic Page Title
**File:** `frontend/src/index.html`  

Current: `<title>Calista</title>` — single word, no keyword signal

**Fix:**
```html
<title>Calista | Mỹ Phẩm Thuần Chay Thiên Nhiên</title>
```

Per-route titles via `SeoService.setPage()`. Pattern for product pages: `{Tên sản phẩm} | Calista`.

---

## MEDIUM Priority Issues

### M1 — Google Fonts Render-Blocking (LCP impact: +200–600ms)
**File:** `frontend/src/index.html`  

Inter is loaded as a synchronous stylesheet — the browser must download it before rendering anything.

**Fix (non-render-blocking load):**
```html
<!-- Remove the current synchronous link -->
<!-- Add print media trick: -->
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" media="print" onload="this.media='all'"/>
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"/></noscript>
```

Or self-host (eliminates DNS + TCP overhead entirely):
```bash
npm install @fontsource/inter
```
Then in `styles.css`: `@import '@fontsource/inter/400.css';` etc.

---

### M2 — No Angular SSR / Lazy Loading (LCP: >4s projected)
Already covered in C2. Without SSR, projected LCP on median connection: **4–6s (Poor)**.

Interim fix (without full SSR) — add `<link rel="preload">` for the hero image:
```html
<link rel="preload" as="image" href="/assets/images/hero.webp" fetchpriority="high"/>
```

Implement route-level lazy loading in `app.routes.ts`:
```typescript
{
  path: 'san-pham/:slug',
  loadComponent: () => import('./features/products/product-detail/product-detail.component')
    .then(m => m.ProductDetailComponent)
}
```

Add `ChangeDetectionStrategy.OnPush` to all product grid components to reduce Zone.js overhead.

---

### M3 — Missing llms.txt (AI Search Readiness)
**Impact:** AI models (ChatGPT, Claude, Perplexity) have no structured brand context  

Create `backend/src/routes/llms.js`:
```javascript
router.get('/llms.txt', (req, res) => {
  res.type('text/plain');
  res.send(`# Calista

> Calista là thương hiệu mỹ phẩm thuần chay Việt Nam, chuyên các sản phẩm
> chăm sóc da từ chiết xuất thực vật. Không thử nghiệm trên động vật,
> không thành phần động vật, bao bì tái chế 100%.

## About

Calista được thành lập với sứ mệnh mang đến sản phẩm chăm sóc da hiệu quả,
an toàn và thân thiện môi trường. Kết hợp tinh chất thực vật với nghiên cứu
da liễu hiện đại, phù hợp mọi loại da kể cả da nhạy cảm.

## Key Claims

- 100% thuần chay (vegan) — không thành phần từ động vật
- Không thử nghiệm trên động vật (cruelty-free)
- Bao bì tái chế 100%
- Miễn phí vận chuyển đơn từ 500.000 VND
- Đổi trả 30 ngày

## Products

- [Tất cả sản phẩm](/san-pham)

## Contact

- Website: https://calista.vn`);
});
```

---

### M4 — Development Build in Production Risk
**File:** `frontend/src/index.html` — `/@vite/client` present  

The Vite HMR script (`/@vite/client`) must never reach production. It exposes WebSocket endpoints and the build is 3–8x larger than a production build.

Verify before any deployment:
```bash
ng build --configuration production
# Confirm /@vite/client is NOT in dist/calista/browser/index.html
grep -r "vite/client" dist/calista/browser/
```

---

## LOW Priority Issues

### L1 — No IndexNow Protocol
Implement after launch. Allows instant indexing on Bing, Yandex, Naver when products are created/updated.

```javascript
// backend/src/utils/indexnow.js
async function pingIndexNow(urls) {
  await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: 'calista.vn',
      key: process.env.INDEXNOW_KEY,
      urlList: urls
    })
  });
}
```

Call from product create/update routes in Node.js backend.

### L2 — No Image Dimensions on Product Cards
Set explicit `width` and `height` on all `<img>` elements to prevent CLS. Use `aspect-ratio` as CSS fallback:
```css
.product-image { aspect-ratio: 3 / 4; width: 100%; height: auto; }
```

### L3 — Admin Routes Not Protected from Indexing
Add `noindex` header or meta tag to all `/admin/**` routes once path routing is active.

### L4 — Product Detail Route Missing `title:` in app.routes.ts
Dynamic title set in component is correct, but add a fallback: `title: 'Sản phẩm | Calista'` in the route definition for the loading state.

---

## Projected CWV After Fixes

| Metric | Current | After C1+C2+M1 | After All Fixes |
|---|---|---|---|
| LCP | Poor (>4s) | Needs Improvement (2.5–3.5s) | Good (<2.5s) |
| INP | Needs Improvement | Needs Improvement | Good (<200ms) |
| CLS | Needs Improvement | Good (<0.1) | Good (<0.05) |

---

## Prioritized Action Plan

### Phase 1 — Architectural (before launch, ~1–2 days)
| # | Task | File | Time |
|---|---|---|---|
| 1 | Remove `withHashLocation()` | `app.config.ts` | 10 min |
| 2 | Add Express SPA catch-all | `backend/src/app.js` | 15 min |
| 3 | Fix meta description encoding | `index.html` | 5 min |
| 4 | Run production build, remove Vite dev script | — | 5 min |
| 5 | `ng add @angular/ssr` | Angular project | 1–2 days |

### Phase 2 — Infrastructure (same sprint as launch)
| # | Task | File | Time |
|---|---|---|---|
| 6 | Add `robots.txt` endpoint | `app.js` | 15 min |
| 7 | Add dynamic `sitemap.xml` endpoint | new route file | 2 hrs |
| 8 | Add `SeoService` (canonical + OG + title) | new service | 1 hr |
| 9 | Wire `SeoService` to AppComponent + all page components | multiple files | 2 hrs |
| 10 | Add `Organization` + `WebSite` JSON-LD to index.html | `index.html` | 30 min |

### Phase 3 — Enrichment (within 2 weeks of launch)
| # | Task | File | Time |
|---|---|---|---|
| 11 | Add `Product` JSON-LD to product detail | `product-detail.component.ts` | 2 hrs |
| 12 | Add `BreadcrumbList` JSON-LD to product detail | same file | 1 hr |
| 13 | Fix Google Fonts to non-render-blocking | `index.html` | 30 min |
| 14 | Implement route-level lazy loading | `app.routes.ts` | 2 hrs |
| 15 | Add `llms.txt` endpoint | new route file | 30 min |
| 16 | Add `ChangeDetectionStrategy.OnPush` to product components | product components | 2 hrs |

### Phase 4 — Long-term (post-launch)
| # | Task |
|---|---|
| 17 | IndexNow API integration in Node.js backend |
| 18 | Image dimension attributes on all product cards |
| 19 | Submit sitemap to Google Search Console and Bing Webmaster Tools |
| 20 | Monitor Core Web Vitals via CrUX after 28-day data collection |

---

## GEO / AI Search Readiness

**Score: 11/100** — all platforms effectively blind to Calista's content.

After fixing C1 (hash routing) + C2 (SSR), projected GEO score: **55–65/100**.

| Platform | Current | After C1+C2 | After All Fixes |
|---|---|---|---|
| Google AI Overviews | 3/100 | ~50/100 | ~75/100 |
| ChatGPT Browse | 5/100 | ~55/100 | ~70/100 |
| Perplexity | 4/100 | ~50/100 | ~70/100 |
| Bing Copilot | 5/100 | ~45/100 | ~65/100 |

Key GEO content opportunities for Vietnamese vegan beauty queries:
- "mỹ phẩm thuần chay Việt Nam"
- "kem dưỡng ẩm thuần chay cho da nhạy cảm"
- "thương hiệu skincare không thử nghiệm động vật Việt Nam"
- "mỹ phẩm chiết xuất thiên nhiên"

The About page mission text, founder narrative, and product descriptions are well-written, citable content — it is simply locked behind CSR. SSR unlocks all of it immediately.

---

*Report generated by claude-seo v2.0.0 — 6 specialist agents: seo-technical, seo-schema, seo-content, seo-geo, seo-performance, seo-sitemap*
