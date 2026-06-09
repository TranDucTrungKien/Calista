import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-tiktok-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="grid md:grid-cols-[200px_1fr] gap-lg">
      <aside>
        <p class="text-label-md uppercase text-on-surface-variant mb-sm px-md">TikTok Shop</p>
        <nav class="space-y-xs">
          <a routerLink="/admin/tiktok" [routerLinkActiveOptions]="{ exact: true }"
             routerLinkActive="bg-primary-container text-on-primary-container"
             class="block px-md py-sm rounded-md text-body-sm hover:bg-surface-mid">
            Kết nối
          </a>
          <a routerLink="/admin/tiktok/token"
             routerLinkActive="bg-primary-container text-on-primary-container"
             class="block px-md py-sm rounded-md text-body-sm hover:bg-surface-mid">
            Trạng thái Token
          </a>
          <a routerLink="/admin/tiktok/san-pham"
             routerLinkActive="bg-primary-container text-on-primary-container"
             class="block px-md py-sm rounded-md text-body-sm hover:bg-surface-mid">
            Sản phẩm
          </a>
          <a routerLink="/admin/tiktok/don-hang"
             routerLinkActive="bg-primary-container text-on-primary-container"
             class="block px-md py-sm rounded-md text-body-sm hover:bg-surface-mid">
            Đơn hàng
          </a>
          <a routerLink="/admin/tiktok/dong-bo"
             routerLinkActive="bg-primary-container text-on-primary-container"
             class="block px-md py-sm rounded-md text-body-sm hover:bg-surface-mid">
            Đồng bộ
          </a>
          <a routerLink="/admin/tiktok/nhat-ky"
             routerLinkActive="bg-primary-container text-on-primary-container"
             class="block px-md py-sm rounded-md text-body-sm hover:bg-surface-mid">
            Nhật ký
          </a>
        </nav>
      </aside>
      <div>
        <router-outlet />
      </div>
    </div>
  `,
})
export class TikTokLayoutComponent {}
