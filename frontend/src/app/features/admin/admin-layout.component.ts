import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ChevronLeftIconComponent } from '../../shared/icons/chevron-left-icon.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ChevronLeftIconComponent,
  ],
  template: `
    <div class="min-h-screen grid md:grid-cols-[240px_1fr]">
      <aside class="md:sticky md:top-0 md:h-screen bg-surface-low border-r border-outline-variant p-md">
        <a routerLink="/" class="flex items-center gap-sm mb-lg text-body-sm text-on-surface-variant hover:text-primary">
          <app-icon-chevron-left [size]="14" /> Về trang chính
        </a>
        <div class="flex items-center gap-sm mb-lg">
          <img src="assets/images/logo.png" alt="" style="height:32px" />
          <span class="text-label-md uppercase">Quản trị</span>
        </div>
        <nav class="space-y-xs">
          <a routerLink="/admin" [routerLinkActiveOptions]="{exact:true}" routerLinkActive="bg-primary-container text-on-primary-container" class="block px-md py-sm rounded-md text-body-sm hover:bg-surface-mid">Tổng quan</a>
          <a routerLink="/admin/san-pham" routerLinkActive="bg-primary-container text-on-primary-container" class="block px-md py-sm rounded-md text-body-sm hover:bg-surface-mid">Sản phẩm</a>
          <a routerLink="/admin/don-hang" routerLinkActive="bg-primary-container text-on-primary-container" class="block px-md py-sm rounded-md text-body-sm hover:bg-surface-mid">Đơn hàng</a>
          <a routerLink="/admin/nguoi-dung" routerLinkActive="bg-primary-container text-on-primary-container" class="block px-md py-sm rounded-md text-body-sm hover:bg-surface-mid">Người dùng</a>
          <a routerLink="/admin/tiktok" routerLinkActive="bg-primary-container text-on-primary-container" class="block px-md py-sm rounded-md text-body-sm hover:bg-surface-mid">TikTok Shop</a>
          <a routerLink="/admin/shopee" routerLinkActive="bg-primary-container text-on-primary-container" class="block px-md py-sm rounded-md text-body-sm hover:bg-surface-mid">Shopee</a>
        </nav>
      </aside>
      <main class="p-lg">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {}
