import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { SearchIconComponent } from '../../icons/search-icon.component';
import { BagIconComponent } from '../../icons/bag-icon.component';
import { UserIconComponent } from '../../icons/user-icon.component';
import { CloseIconComponent } from '../../icons/close-icon.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    SearchIconComponent,
    BagIconComponent,
    UserIconComponent,
    CloseIconComponent,
  ],
  template: `
    <header
      class="sticky top-0 z-40 bg-surface transition-shadow"
      [class.shadow-soft]="scrolled()"
      style="border-bottom: 1px solid var(--color-outline-variant);"
    >
      <!-- 3-column grid: logo | centered nav | utilities -->
      <div class="container-app items-center" style="height:80px; display:grid; grid-template-columns:1fr auto 1fr;">

        <!-- LEFT: Logo -->
        <a routerLink="/" class="flex items-center shrink-0 justify-self-start">
          <img src="assets/images/logo.png" alt="Calista" style="height:56px;width:auto" />
        </a>

        <!-- CENTER: Desktop nav -->
        <nav class="hidden lg:flex items-center gap-xs">
          <a routerLink="/" routerLinkActive="text-primary font-semibold"
             [routerLinkActiveOptions]="{exact:true}"
             class="px-sm py-xs rounded-[8px] text-[14px] font-medium text-on-surface hover:bg-surface-low transition-colors whitespace-nowrap">
            Trang chủ
          </a>
          <a routerLink="/san-pham" routerLinkActive="text-primary font-semibold"
             class="px-sm py-xs rounded-[8px] text-[14px] font-medium text-on-surface hover:bg-surface-low transition-colors whitespace-nowrap">
            Sản phẩm
          </a>
          <a routerLink="/ve-chung-toi" routerLinkActive="text-primary font-semibold"
             class="px-sm py-xs rounded-[8px] text-[14px] font-medium text-on-surface hover:bg-surface-low transition-colors whitespace-nowrap">
            Về chúng tôi
          </a>
          <a routerLink="/lien-he" routerLinkActive="text-primary font-semibold"
             class="px-sm py-xs rounded-[8px] text-[14px] font-medium text-on-surface hover:bg-surface-low transition-colors whitespace-nowrap">
            Liên hệ
          </a>
        </nav>

        <!-- RIGHT: Utilities -->
        <div class="flex items-center gap-xs justify-self-end">

        <!-- Search toggle -->
        <button
          type="button"
          (click)="toggleSearch()"
          class="p-sm rounded-full hover:bg-surface-low transition-colors"
          aria-label="Tìm kiếm"
        >
          @if (searchOpen()) {
            <app-icon-close [size]="20" />
          } @else {
            <app-icon-search [size]="20" />
          }
        </button>

        <!-- Cart -->
        <a
          routerLink="/gio-hang"
          class="relative p-sm rounded-full hover:bg-surface-low transition-colors"
          aria-label="Giỏ hàng"
        >
          <app-icon-bag [size]="20" />
          @if (cart.count() > 0) {
            <span
              class="absolute -top-[2px] -right-[2px] bg-primary text-on-primary text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-[5px] animate-pop"
            >
              {{ cart.count() }}
            </span>
          }
        </a>

        <!-- User menu -->
        @if (auth.isAuthenticated()) {
          <div class="relative hidden md:block">
            <button
              type="button"
              (click)="menuOpen.set(!menuOpen())"
              class="flex items-center gap-sm border border-outline-variant rounded-full px-sm py-xs hover:shadow-soft transition-all"
            >
              <app-icon-user [size]="18" />
              <span class="text-body-sm hidden lg:inline max-w-[120px] truncate">{{ auth.user()?.name }}</span>
            </button>
            @if (menuOpen()) {
              <div
                class="absolute right-0 mt-sm w-[210px] bg-surface rounded-[14px] shadow-card border border-outline-variant py-sm animate-slide-down"
              >
                <a routerLink="/tai-khoan" (click)="menuOpen.set(false)" class="block px-md py-sm text-body-sm hover:bg-surface-low rounded-sm mx-sm">Tài khoản</a>
                <a routerLink="/don-hang" (click)="menuOpen.set(false)" class="block px-md py-sm text-body-sm hover:bg-surface-low rounded-sm mx-sm">Đơn hàng</a>
                <a routerLink="/yeu-thich" (click)="menuOpen.set(false)" class="block px-md py-sm text-body-sm hover:bg-surface-low rounded-sm mx-sm">Yêu thích</a>
                @if (auth.isAdmin()) {
                  <a routerLink="/admin" (click)="menuOpen.set(false)" class="block px-md py-sm text-body-sm hover:bg-surface-low rounded-sm mx-sm text-primary font-semibold">Quản trị</a>
                }
                <div class="border-t border-outline-variant my-xs mx-sm"></div>
                <button type="button" (click)="logout()" class="w-full text-left px-md py-sm text-body-sm hover:bg-surface-low rounded-sm mx-sm text-error" style="width:calc(100% - 16px)">Đăng xuất</button>
              </div>
            }
          </div>
        } @else {
          <a routerLink="/dang-nhap" class="hidden md:inline-flex btn-primary !py-[8px] !px-md text-[13px]">Đăng nhập</a>
        }

        <!-- Mobile hamburger -->
        <button
          type="button"
          class="lg:hidden p-sm rounded-full hover:bg-surface-low transition-colors"
          (click)="mobileMenuOpen.set(!mobileMenuOpen())"
          aria-label="Menu"
        >
          @if (mobileMenuOpen()) {
            <app-icon-close [size]="20" />
          } @else {
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          }
        </button>

        </div><!-- end RIGHT utilities -->
      </div><!-- end 3-col grid -->

      <!-- Mobile menu drawer -->
      @if (mobileMenuOpen()) {
        <div class="lg:hidden border-t border-outline-variant bg-surface animate-slide-down">
          <div class="container-app py-md space-y-xs">
            <a routerLink="/" (click)="mobileMenuOpen.set(false)" class="block px-md py-sm text-body-md font-medium hover:bg-surface-low rounded-[8px]">Trang chủ</a>
            <a routerLink="/san-pham" (click)="mobileMenuOpen.set(false)" class="block px-md py-sm text-body-md font-medium hover:bg-surface-low rounded-[8px]">Sản phẩm</a>
            <a routerLink="/ve-chung-toi" (click)="mobileMenuOpen.set(false)" class="block px-md py-sm text-body-md font-medium hover:bg-surface-low rounded-[8px]">Về chúng tôi</a>
            <a routerLink="/lien-he" (click)="mobileMenuOpen.set(false)" class="block px-md py-sm text-body-md font-medium hover:bg-surface-low rounded-[8px]">Liên hệ</a>
            <div class="border-t border-outline-variant pt-sm">
              @if (auth.isAuthenticated()) {
                <a routerLink="/tai-khoan" (click)="mobileMenuOpen.set(false)" class="block px-md py-sm text-body-md hover:bg-surface-low rounded-[8px]">Tài khoản</a>
                <a routerLink="/don-hang" (click)="mobileMenuOpen.set(false)" class="block px-md py-sm text-body-md hover:bg-surface-low rounded-[8px]">Đơn hàng</a>
                <button type="button" (click)="logout(); mobileMenuOpen.set(false)" class="w-full text-left px-md py-sm text-body-md hover:bg-surface-low rounded-[8px] text-error">Đăng xuất</button>
              } @else {
                <a routerLink="/dang-nhap" (click)="mobileMenuOpen.set(false)" class="block px-md py-sm text-body-md font-semibold text-primary">Đăng nhập</a>
                <a routerLink="/dang-ky" (click)="mobileMenuOpen.set(false)" class="block px-md py-sm text-body-md hover:bg-surface-low rounded-[8px]">Đăng ký</a>
              }
            </div>
          </div>
        </div>
      }

      <!-- Search bar -->
      @if (searchOpen()) {
        <div class="border-t border-outline-variant bg-surface animate-slide-down">
          <div class="container-app py-md">
            <form (submit)="search($event)" class="flex gap-sm">
              <div class="flex-1 flex items-center gap-sm border border-outline-variant rounded-full px-md bg-surface-low focus-within:border-on-surface transition-colors">
                <app-icon-search [size]="16" class="text-outline shrink-0" />
                <input
                  #q
                  class="flex-1 bg-transparent py-[10px] text-body-md text-on-surface placeholder:text-outline outline-none"
                  placeholder="Tìm sản phẩm yêu thích..."
                  autofocus
                />
              </div>
              <button type="submit" class="btn-primary rounded-full px-lg">Tìm</button>
            </form>
          </div>
        </div>
      }
    </header>
  `,
})
export class NavbarComponent {
  auth = inject(AuthService);
  cart = inject(CartService);
  private router = inject(Router);

  scrolled = signal(false);
  searchOpen = signal(false);
  menuOpen = signal(false);
  mobileMenuOpen = signal(false);

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 4);
  }

  toggleSearch() {
    this.searchOpen.update((v) => !v);
    this.mobileMenuOpen.set(false);
  }

  search(ev: Event) {
    ev.preventDefault();
    const form = ev.target as HTMLFormElement;
    const input = form.querySelector('input') as HTMLInputElement;
    const q = input.value.trim();
    if (!q) return;
    this.router.navigate(['/tim-kiem'], { queryParams: { q } });
    this.searchOpen.set(false);
    input.value = '';
  }

  logout() {
    this.menuOpen.set(false);
    this.auth.logout();
  }
}
