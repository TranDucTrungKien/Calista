const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');

const routes = require('./routes');
const errorHandler = require('./middleware/error');
const tiktokWebhookCtrl = require('./controllers/tiktok/tiktokWebhook');
const shopeeWebhookCtrl = require('./controllers/shopee/shopeeWebhook');

const app = express();

const origins = (process.env.CORS_ORIGINS || 'http://localhost:4200')
  .split(',')
  .map((o) => o.trim());

// Webhook MUST be registered before express.json() so we receive the raw body for signature validation
app.post('/api/tiktok/webhook', express.raw({ type: '*/*' }), tiktokWebhookCtrl.receive);
app.post('/api/shopee/webhook', express.raw({ type: '*/*' }), shopeeWebhookCtrl.receive);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || origins.includes(origin)) return cb(null, true);
      return cb(new Error('CORS không cho phép origin này'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// robots.txt
app.get('/robots.txt', (_req, res) => {
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

User-agent: OAI-SearchBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: https://calista.vn/sitemap.xml`);
});

// llms.txt — AI-readable brand context
app.get('/llms.txt', (_req, res) => {
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
- Bao bì tái chế 100%, in mực gốc nước
- Miễn phí vận chuyển đơn từ 500.000 VND
- Đổi trả 30 ngày

## Products

- [Tất cả sản phẩm](https://calista.vn/san-pham)

## Contact

- Website: https://calista.vn`);
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', routes);

// Sitemap
app.use('/', require('./routes/sitemap'));

// SPA fallback — serve Angular build in production (local only, not on Vercel)
if (!process.env.VERCEL) {
  const DIST = path.join(__dirname, '../../frontend/dist/calista/browser');
  app.use(express.static(DIST));
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
    const index = path.join(DIST, 'index.html');
    res.sendFile(index, (err) => {
      if (err) res.status(404).json({ message: 'Không tìm thấy tài nguyên' });
    });
  });
}

app.use(errorHandler);

module.exports = app;
