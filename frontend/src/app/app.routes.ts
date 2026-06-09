import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then(
        (m) => m.LayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then((m) => m.HomeComponent),
        title: 'Calista - Skincare Boutique',
      },
      {
        path: 'san-pham',
        loadComponent: () =>
          import('./features/products/products.component').then(
            (m) => m.ProductsComponent
          ),
        title: 'Sản phẩm | Calista',
      },
      {
        path: 'san-pham/:slug',
        loadComponent: () =>
          import('./features/product-detail/product-detail.component').then(
            (m) => m.ProductDetailComponent
          ),
      },
      {
        path: 'gio-hang',
        loadComponent: () =>
          import('./features/cart/cart.component').then((m) => m.CartComponent),
        title: 'Giỏ hàng | Calista',
      },
      {
        path: 'thanh-toan',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/checkout/checkout.component').then(
            (m) => m.CheckoutComponent
          ),
        title: 'Thanh toán | Calista',
      },
      {
        path: 'yeu-thich',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/wishlist/wishlist.component').then(
            (m) => m.WishlistComponent
          ),
        title: 'Yêu thích | Calista',
      },
      {
        path: 'don-hang',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/orders/orders.component').then(
            (m) => m.OrdersComponent
          ),
        title: 'Đơn hàng | Calista',
      },
      {
        path: 'don-hang/:id',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/orders/order-detail.component').then(
            (m) => m.OrderDetailComponent
          ),
      },
      {
        path: 'tai-khoan',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
        title: 'Tài khoản | Calista',
      },
      {
        path: 'tim-kiem',
        loadComponent: () =>
          import('./features/products/products.component').then(
            (m) => m.ProductsComponent
          ),
        title: 'Tìm kiếm | Calista',
      },
      {
        path: 've-chung-toi',
        loadComponent: () =>
          import('./features/about/about.component').then((m) => m.AboutComponent),
        title: 'Về chúng tôi | Calista',
      },
      {
        path: 'lien-he',
        loadComponent: () =>
          import('./features/contact/contact.component').then((m) => m.ContactComponent),
        title: 'Liên hệ | Calista',
      },
    ],
  },
  {
    path: 'dang-nhap',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
    title: 'Đăng nhập — Calista',
  },
  {
    path: 'dang-ky',
    loadComponent: () =>
      import('./features/auth/register.component').then(
        (m) => m.RegisterComponent
      ),
    title: 'Đăng ký — Calista',
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      {
        path: 'san-pham',
        loadComponent: () =>
          import('./features/admin/products-admin.component').then(
            (m) => m.AdminProductsComponent
          ),
      },
      {
        path: 'don-hang',
        loadComponent: () =>
          import('./features/admin/orders-admin.component').then(
            (m) => m.AdminOrdersComponent
          ),
      },
      {
        path: 'nguoi-dung',
        loadComponent: () =>
          import('./features/admin/users-admin.component').then(
            (m) => m.AdminUsersComponent
          ),
      },
      {
        path: 'tiktok',
        loadComponent: () =>
          import('./features/admin/tiktok/tiktok-layout.component').then(
            (m) => m.TikTokLayoutComponent
          ),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/admin/tiktok/tiktok-connect.component').then(
                (m) => m.TikTokConnectComponent
              ),
            title: 'TikTok Shop — Kết nối',
          },
          {
            path: 'token',
            loadComponent: () =>
              import('./features/admin/tiktok/tiktok-token-health.component').then(
                (m) => m.TikTokTokenHealthComponent
              ),
            title: 'TikTok Shop — Token',
          },
          {
            path: 'san-pham',
            loadComponent: () =>
              import('./features/admin/tiktok/tiktok-products.component').then(
                (m) => m.TikTokProductsComponent
              ),
            title: 'TikTok Shop — Sản phẩm',
          },
          {
            path: 'don-hang',
            loadComponent: () =>
              import('./features/admin/tiktok/tiktok-orders.component').then(
                (m) => m.TikTokOrdersComponent
              ),
            title: 'TikTok Shop — Đơn hàng',
          },
          {
            path: 'dong-bo',
            loadComponent: () =>
              import('./features/admin/tiktok/tiktok-sync.component').then(
                (m) => m.TikTokSyncComponent
              ),
            title: 'TikTok Shop — Đồng bộ',
          },
          {
            path: 'nhat-ky',
            loadComponent: () =>
              import('./features/admin/tiktok/tiktok-error-logs.component').then(
                (m) => m.TikTokErrorLogsComponent
              ),
            title: 'TikTok Shop — Nhật ký',
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
