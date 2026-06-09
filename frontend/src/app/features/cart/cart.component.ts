import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { VndPipe } from '../../shared/pipes/vnd.pipe';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TrashIconComponent } from '../../shared/icons/trash-icon.component';
import { PlusIconComponent } from '../../shared/icons/plus-icon.component';
import { MinusIconComponent } from '../../shared/icons/minus-icon.component';
import { CartItem } from '../../core/models';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    VndPipe,
    EmptyStateComponent,
    TrashIconComponent,
    PlusIconComponent,
    MinusIconComponent,
  ],
  template: `
    <div class="container-app py-lg">
      <h1 class="text-headline-md mb-lg">Giỏ hàng của bạn</h1>

      @if (cart.cart().items.length === 0) {
        <app-empty-state title="Giỏ hàng trống" message="Hãy khám phá những sản phẩm Calista yêu thích và thêm vào giỏ hàng.">
          <a routerLink="/san-pham" class="btn-primary mt-md">Khám phá sản phẩm</a>
        </app-empty-state>
      } @else {
        <div class="grid lg:grid-cols-[1fr_360px] gap-xl">
          <div class="space-y-md">
            @for (item of cart.cart().items; track item._id) {
              <div class="card p-md flex gap-md items-center">
                <a [routerLink]="['/san-pham', item.snapshot.slug]" class="shrink-0">
                  <img [src]="item.snapshot.image" alt="" class="w-[88px] h-[88px] md:w-[100px] md:h-[100px] rounded-md object-cover" />
                </a>
                <div class="flex-1 min-w-0">
                  <a [routerLink]="['/san-pham', item.snapshot.slug]" class="font-display text-[18px] leading-tight line-clamp-2 hover:text-primary">
                    {{ item.snapshot.name }}
                  </a>
                  <p class="text-body-sm text-on-surface-variant mt-xs">{{ item.price | vnd }} / sản phẩm</p>
                  <div class="flex items-center justify-between mt-sm">
                    <div class="flex items-center border border-outline-variant rounded-md overflow-hidden">
                      <button type="button" (click)="dec(item)" class="w-[32px] h-[32px] flex items-center justify-center hover:bg-surface-mid">
                        <app-icon-minus [size]="14" />
                      </button>
                      <span class="w-[40px] text-center text-body-sm">{{ item.qty }}</span>
                      <button type="button" (click)="inc(item)" class="w-[32px] h-[32px] flex items-center justify-center hover:bg-surface-mid">
                        <app-icon-plus [size]="14" />
                      </button>
                    </div>
                    <button type="button" (click)="remove(item)" class="text-on-surface-variant hover:text-error p-sm" aria-label="Xóa">
                      <app-icon-trash [size]="16" />
                    </button>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-display text-headline-sm text-primary">{{ item.qty * item.price | vnd }}</p>
                </div>
              </div>
            }
          </div>

          <aside class="lg:sticky lg:top-[88px] self-start">
            <div class="card p-md space-y-md">
              <h2 class="text-headline-sm">Tóm tắt đơn hàng</h2>
              <div class="space-y-sm text-body-md">
                <div class="flex justify-between">
                  <span class="text-on-surface-variant">Tạm tính</span>
                  <span>{{ cart.subtotal() | vnd }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-on-surface-variant">Phí vận chuyển</span>
                  <span>{{ shipping() | vnd }}</span>
                </div>
                @if (cart.subtotal() < 500000) {
                  <p class="text-body-sm text-on-surface-variant bg-surface-low rounded-md p-sm">
                    Mua thêm {{ (500000 - cart.subtotal()) | vnd }} để được miễn phí vận chuyển.
                  </p>
                }
              </div>
              <div class="border-t border-outline-variant pt-md flex justify-between font-display text-headline-sm">
                <span>Tổng cộng</span>
                <span class="text-primary">{{ total() | vnd }}</span>
              </div>
              <button type="button" (click)="checkout()" class="btn-primary btn-block">Tiến hành thanh toán</button>
              <a routerLink="/san-pham" class="btn-ghost btn-block">Tiếp tục mua sắm</a>
            </div>
          </aside>
        </div>
      }
    </div>
  `,
})
export class CartComponent {
  cart = inject(CartService);
  private auth = inject(AuthService);
  private router = inject(Router);

  shipping() {
    const s = this.cart.subtotal();
    if (s === 0) return 0;
    return s >= 500000 ? 0 : 30000;
  }
  total() {
    return this.cart.subtotal() + this.shipping();
  }

  inc(item: CartItem) {
    this.cart.updateQty(item, item.qty + 1);
  }
  dec(item: CartItem) {
    if (item.qty <= 1) return;
    this.cart.updateQty(item, item.qty - 1);
  }
  remove(item: CartItem) {
    this.cart.remove(item);
  }

  checkout() {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/dang-nhap'], {
        queryParams: { returnUrl: '/thanh-toan' },
      });
      return;
    }
    this.router.navigateByUrl('/thanh-toan');
  }
}
