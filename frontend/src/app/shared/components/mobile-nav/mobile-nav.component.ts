import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { BagIconComponent } from '../../icons/bag-icon.component';
import { HeartIconComponent } from '../../icons/heart-icon.component';
import { SearchIconComponent } from '../../icons/search-icon.component';
import { UserIconComponent } from '../../icons/user-icon.component';
import { FlowerIconComponent } from '../../icons/flower-icon.component';

@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    BagIconComponent,
    HeartIconComponent,
    SearchIconComponent,
    UserIconComponent,
    FlowerIconComponent,
  ],
  template: `
    <nav class="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-outline-variant">
      <div class="grid grid-cols-5">
        <a routerLink="/" [routerLinkActiveOptions]="{exact:true}" routerLinkActive="text-primary"
           class="flex flex-col items-center justify-center py-sm text-on-surface-variant gap-[2px]">
          <app-icon-flower [size]="22" />
          <span class="text-[10px] font-medium">Trang chủ</span>
        </a>
        <a routerLink="/tim-kiem" routerLinkActive="text-primary"
           class="flex flex-col items-center justify-center py-sm text-on-surface-variant gap-[2px]">
          <app-icon-search [size]="22" />
          <span class="text-[10px] font-medium">Tìm kiếm</span>
        </a>
        <a routerLink="/gio-hang" routerLinkActive="text-primary"
           class="relative flex flex-col items-center justify-center py-sm text-on-surface-variant gap-[2px]">
          <app-icon-bag [size]="22" />
          @if (cart.count() > 0) {
            <span class="absolute top-[4px] right-[18%] bg-primary text-on-primary text-[10px] font-semibold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-[4px]">{{ cart.count() }}</span>
          }
          <span class="text-[10px] font-medium">Giỏ hàng</span>
        </a>
        <a routerLink="/yeu-thich" routerLinkActive="text-primary"
           class="flex flex-col items-center justify-center py-sm text-on-surface-variant gap-[2px]">
          <app-icon-heart [size]="22" />
          <span class="text-[10px] font-medium">Yêu thích</span>
        </a>
        <a routerLink="/tai-khoan" routerLinkActive="text-primary"
           class="flex flex-col items-center justify-center py-sm text-on-surface-variant gap-[2px]">
          <app-icon-user [size]="22" />
          <span class="text-[10px] font-medium">Tài khoản</span>
        </a>
      </div>
    </nav>
  `,
})
export class MobileNavComponent {
  cart = inject(CartService);
}
