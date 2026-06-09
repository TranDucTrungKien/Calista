# Calista — TMĐT mỹ phẩm thuần chay

Calista là website thương mại điện tử dành cho thương hiệu mỹ phẩm thuần chay,
được xây dựng theo phong cách thiết kế **Botanical Minimalist · Natural Luxury**.

- **Frontend** : Angular 18 (standalone components) + Tailwind CSS
- **Backend**  : Node.js + Express + Mongoose
- **Database** : MongoDB
- **Auth**     : JWT (access 15m + refresh 7d httpOnly cookie)
- **Payment**  : MoMo & ZaloPay (sandbox stub) + COD

Toàn bộ giao diện và thông báo được Việt hóa.

---

## 1. Cấu trúc thư mục

```
calista/
├── backend/           # API Express + Mongoose
│   ├── src/
│   │   ├── config/    # Kết nối DB
│   │   ├── models/    # User, Product, Category, Cart, Order, Review
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/  # JWT, Email, Payment stub
│   │   ├── app.js
│   │   ├── server.js
│   │   └── seed.js
│   ├── .env.example
│   └── package.json
└── frontend/          # Angular 18 app
    ├── src/
    │   ├── app/
    │   │   ├── core/        # services, guards, interceptors, models
    │   │   ├── shared/      # components, icons, pipes
    │   │   ├── features/    # home, products, cart, checkout, admin, ...
    │   │   └── app.routes.ts
    │   ├── assets/images/   # logo.png
    │   └── styles/          # tokens.css, global.css
    └── angular.json
```

---

## 2. Yêu cầu hệ thống

- Node.js **≥ 18** (khuyến nghị 20+)
- npm **≥ 9**
- MongoDB **≥ 6** (chạy local hoặc Atlas)

---

## 3. Cài đặt nhanh

### 3.1 Backend

```bash
cd backend
npm install
cp .env.example .env       # Windows: copy .env.example .env
# Chỉnh sửa biến môi trường trong .env nếu cần
npm run seed               # Tạo dữ liệu mẫu (danh mục, sản phẩm, tài khoản)
npm run dev                # Chạy backend tại http://localhost:5000
```

### 3.2 Frontend

```bash
cd frontend
npm install
npm start                  # Chạy Angular tại http://localhost:4200
```

Mở [http://localhost:4200](http://localhost:4200) trên trình duyệt để truy cập website.

---

## 4. Biến môi trường (`backend/.env`)

| Tên                | Mô tả                                            | Mặc định gợi ý |
|--------------------|--------------------------------------------------|-----------------|
| `PORT`             | Cổng API                                         | `5000`          |
| `MONGO_URI`        | Chuỗi kết nối MongoDB                           | `mongodb://127.0.0.1:27017/calista` |
| `JWT_ACCESS_SECRET`| Bí mật ký access token                          | (đổi sang chuỗi dài ngẫu nhiên) |
| `JWT_REFRESH_SECRET`| Bí mật ký refresh token                        | (đổi sang chuỗi dài ngẫu nhiên) |
| `CORS_ORIGINS`     | Danh sách origin được phép (phân cách `,`)       | `http://localhost:4200` |
| `COOKIE_SECURE`    | Bật `Secure` cookie khi triển khai HTTPS         | `false` (dev)   |
| `SMTP_*`           | SMTP để gửi email xác nhận đơn hàng              | trống → bỏ qua  |
| `MOMO_*` / `ZALOPAY_*` | Khóa cổng thanh toán (sandbox)              | có thể để trống |
| `FRONTEND_URL`     | URL frontend dùng cho link trong email           | `http://localhost:4200` |

> 💡 Phương thức thanh toán **MoMo / ZaloPay** đang ở chế độ stub: API tạo đơn vẫn trả ra `payUrl`
> để frontend chuyển hướng người dùng, nhưng không có request thật sang cổng thanh toán.
> Khi triển khai production, thay phần `services/payment.js` bằng request đến endpoint
> chính thức của MoMo (`/v2/gateway/api/create`) hoặc ZaloPay (`/v2/create`) cùng chữ ký HMAC.

---

## 5. Tài khoản mặc định sau khi seed

| Vai trò    | Email                  | Mật khẩu   |
|------------|------------------------|------------|
| Quản trị   | `admin@calista.vn`     | `Admin@123`|
| Khách hàng | `khach@calista.vn`     | `Khach@123`|

---

## 6. Scripts

### Backend (`backend/`)

```bash
npm run dev    # chạy với nodemon
npm start      # chạy production
npm run seed   # tạo dữ liệu mẫu
```

### Frontend (`frontend/`)

```bash
npm start          # ng serve --port 4200
npm run build      # build production
```

---

## 7. Tính năng đã hoàn thiện

### Phase 1 — Core
- ✅ Đăng ký / Đăng nhập / Đăng xuất / Refresh JWT
- ✅ Route guard cho người dùng & admin
- ✅ Danh sách sản phẩm với bộ lọc (danh mục, loại da, thuộc tính, giá), sắp xếp, phân trang
- ✅ Trang chi tiết sản phẩm: gallery, đánh giá, sản phẩm liên quan, sticky add-to-cart bar
- ✅ Giỏ hàng: thêm/xóa/cập nhật số lượng, đồng bộ localStorage ↔ DB

### Phase 2 — User
- ✅ Thanh toán: form địa chỉ, chọn phương thức (MoMo / ZaloPay / COD)
- ✅ Wishlist: yêu thích sản phẩm, lưu DB
- ✅ Đơn hàng: lịch sử, chi tiết, timeline trạng thái, hủy đơn
- ✅ Tài khoản: chỉnh thông tin, sổ địa chỉ, đổi mật khẩu
- ✅ Reviews: đánh giá sao + bình luận

### Phase 3 — Admin (scaffolded)
- ✅ Dashboard: tổng đơn, doanh thu, khách hàng, đơn gần đây
- ✅ Quản lý sản phẩm (view list, low-stock alert)
- ✅ Quản lý đơn hàng (đổi trạng thái)
- ✅ Quản lý người dùng

### Phase 4 — Polish (scaffolded)
- ✅ Tìm kiếm với từ khóa
- ✅ Email xác nhận đơn hàng (qua SMTP nếu cấu hình)
- ✅ Skeleton loader trên các trang list/detail
- ✅ SEO: `<title>` theo từng route

> Các phần CRUD sản phẩm với upload Cloudinary, biểu đồ doanh thu chi tiết,
> autocomplete tìm kiếm và polish UI nâng cao được lên khung sẵn để mở rộng dễ dàng.

---

## 8. Hệ thống thiết kế

Các CSS variables ở [`frontend/src/styles/tokens.css`](frontend/src/styles/tokens.css) cùng
Tailwind config ở [`frontend/tailwind.config.js`](frontend/tailwind.config.js) định nghĩa:

- Bảng màu Sage Green / Nude / Warm Gold theo concept "Natural Luxury"
- Font headlines: **Playfair Display** — Font body: **Be Vietnam Pro**
- Spacing, radius, shadow theo Material 3 Expressive
- Toàn bộ icon là **SVG hand-crafted** trong `frontend/src/app/shared/icons/`
  (không sử dụng bất kỳ thư viện icon nào)

---

## 9. Triển khai sản xuất

1. **Backend**: build Docker hoặc deploy lên Render / Railway / Heroku.
   - Cấu hình biến môi trường (đổi `JWT_*_SECRET`, bật `COOKIE_SECURE=true`).
   - Đặt `CORS_ORIGINS` về domain thật.
2. **Frontend**:
   ```bash
   cd frontend
   npm run build
   ```
   Triển khai folder `dist/calista/browser` lên Netlify / Vercel / Cloudflare Pages.
   Cập nhật `environment.ts` (`apiUrl`) trỏ về domain API.
3. **Database**: MongoDB Atlas — copy chuỗi kết nối vào `MONGO_URI`.
4. **Payment**: triển khai chính thức MoMo/ZaloPay bằng việc thay `services/payment.js`
   theo hướng dẫn ở mục 4.

---

## 10. Logo

File `frontend/src/assets/images/logo.png` được sử dụng cho:

- Navbar (40px desktop / 32px mobile)
- Footer (48px)
- Trang đăng nhập / đăng ký (56px)

Không tạo lại logo dạng text/SVG — luôn dùng file PNG này và giữ đúng tỉ lệ.

---

## 11. License

Internal project — không phát hành công khai.
