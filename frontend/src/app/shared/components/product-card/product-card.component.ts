import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../../core/models';
import { VndPipe } from '../../pipes/vnd.pipe';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { StarFilledIconComponent } from '../../icons/star-filled-icon.component';
import { HeartIconComponent } from '../../icons/heart-icon.component';
import { HeartFilledIconComponent } from '../../icons/heart-filled-icon.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    VndPipe,
    StarFilledIconComponent,
    HeartIconComponent,
    HeartFilledIconComponent,
  ],
  template: `
    <article
      class="group flex flex-col h-full overflow-hidden bg-transparent transition-colors duration-200"
      style="border: 1px solid var(--color-outline-variant); border-radius: 0; box-shadow: none;"
    >
      <!-- Photo — no padding, fills full width -->
      <a [routerLink]="['/san-pham', product.slug]"
         class="block relative overflow-hidden bg-surface-low aspect-square">
        @if (product.images.length > 0) {
          <img
            [src]="product.images[0]"
            [alt]="product.name"
            loading="lazy"
            class="w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
            (error)="onImgError($event)"
          />
          @if (product.images.length > 1) {
            <img
              [src]="product.images[1]"
              [alt]="product.name"
              loading="lazy"
              class="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              (error)="onImg2Error($event)"
            />
          }
        } @else {
          <div class="w-full h-full flex flex-col items-center justify-center gap-sm text-on-surface-variant opacity-40 select-none">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span style="font-size:11px;">Chưa có ảnh</span>
          </div>
        }

        <!-- Discount badge -->
        @if (product.comparePrice && product.comparePrice > product.price) {
          <span class="absolute top-sm left-sm bg-primary text-on-primary text-[11px] font-semibold rounded-full px-sm py-[3px]">
            -{{ discountPct() }}%
          </span>
        }

        <!-- Wishlist -->
        <button
          type="button"
          (click)="onWishlist($event)"
          class="absolute top-sm right-sm p-[6px] bg-surface rounded-full shadow-soft hover:scale-110 transition-transform"
          [attr.aria-label]="wishlisted ? 'Bỏ yêu thích' : 'Thêm yêu thích'"
        >
          @if (wishlisted) {
            <app-icon-heart-filled [size]="16" class="text-primary" />
          } @else {
            <app-icon-heart [size]="16" class="text-on-surface-variant" />
          }
        </button>
      </a>

      <!-- Info — Feature Card spec: padding 32px 40px, #1D1D1F, 17px/400/25px -->
      <div class="flex-1 min-h-0 overflow-visible flex flex-col items-center text-center" style="padding: 10px 20px 20px 20px;">

        <!-- Label Card (Meta) spec: rgba(0,0,0,0.56), 12px/400/16px, padding 8px 0 -->
        @if (categoryName()) {
          <p style="color: var(--color-on-surface-variant); font-size:12px; font-weight:400; line-height:16px; padding: 8px 0;">
            {{ categoryName() }}
          </p>
        }

        <a [routerLink]="['/san-pham', product.slug]"
           class="line-clamp-2 transition-colors hover:text-primary w-full"
           style="color: var(--color-on-surface); font-size:17px; font-weight:400; line-height:25px;">
           {{ product.name }}
        </a>

        @if (product.ratings.count > 0) {
          <div class="flex items-center justify-center gap-xs mt-sm" style="color: var(--color-on-surface-variant); font-size:12px; line-height:16px;">
            <app-icon-star-filled [size]="12" class="text-primary shrink-0" />
            <span>{{ product.ratings.avg }}</span>
            <span>({{ product.ratings.count }})</span>
          </div>
        }

        <div class="mt-auto flex flex-col items-center gap-sm pt-md w-full">
          <div class="flex flex-col items-center">
            @if (product.comparePrice && product.comparePrice > product.price) {
              <span class="line-through" style="color: var(--color-on-surface-variant); font-size:13px; line-height:18px;">{{ product.comparePrice | vnd }}</span>
            }
            <span style="color: var(--color-on-surface); font-size:17px; font-weight:600; line-height:25px;">{{ product.price | vnd }}</span>
          </div>
          <button
            type="button"
            (click)="onAdd($event)"
            [attr.data-tooltip]="'Giá: ' + (product.price | vnd)"
            class="button shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <div class="button-wrapper">
              <div class="text">+ Thêm</div>
              <span class="icon">
                <svg viewBox="0 0 16 16" class="bi bi-cart2" fill="currentColor" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .485.379L2.89 4H14.5a.5.5 0 0 1 .485.621l-1.5 6A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.485-.379L1.61 3H.5a.5.5 0 0 1-.5-.5zM3.14 5l1.25 5h8.22l1.25-5H3.14zM5 13a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm9-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0z"></path>
                </svg>
              </span>
            </div>
          </button>
        </div>
      </div>
    </article>
  `,
  styles: [`
    .button {
      --width: 80px;
      --height: 32px;
      --tooltip-height: 32px;
      --tooltip-width: 115px;
      --gap-between-tooltip-to-button: 12px;
      --button-color: var(--color-primary, #546349);
      --tooltip-bg-color: var(--color-on-surface, #1c1c1a);
      --tooltip-text-color: var(--color-background, #fcf9f5);
      
      width: var(--width);
      height: var(--height);
      background: var(--button-color);
      position: relative;
      text-align: center;
      border-radius: 20px;
      font-family: inherit;
      border: none;
      cursor: pointer;
      display: inline-block;
      overflow: visible;
    }

    .button::before {
      position: absolute;
      content: attr(data-tooltip);
      width: var(--tooltip-width);
      height: var(--tooltip-height);
      background-color: var(--tooltip-bg-color);
      font-size: 11px;
      font-weight: 500;
      color: var(--tooltip-text-color);
      border-radius: 2px;
      line-height: var(--tooltip-height);
      bottom: calc(var(--height) + var(--gap-between-tooltip-to-button) + 8px);
      left: calc(50% - var(--tooltip-width) / 2);
    }

    .button::after {
      position: absolute;
      content: '';
      width: 0;
      height: 0;
      border: 6px solid transparent;
      border-top-color: var(--tooltip-bg-color);
      left: calc(50% - 6px);
      bottom: calc(100% + var(--gap-between-tooltip-to-button) - 6px);
    }

    .button::after, .button::before {
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      pointer-events: none;
      z-index: 50;
    }

    .button-wrapper {
      overflow: hidden;
      position: absolute;
      width: 100%;
      height: 100%;
      left: 0;
      top: 0;
    }

    .text {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      position: absolute;
      left: 0;
      top: 0;
      color: var(--color-on-primary, #ffffff);
      font-size: 12px;
      font-weight: 600;
      transition: top 0.3s ease;
    }

    .icon {
      position: absolute;
      width: 100%;
      height: 100%;
      left: 0;
      top: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-on-primary, #ffffff);
      transition: top 0.3s ease;
    }

    .icon svg {
      width: 18px;
      height: 18px;
    }

    .button:hover {
      background: var(--color-primary-container, #a8b89a);
    }

    .button:hover .text {
      top: -100%;
    }

    .button:hover .icon {
      top: 0;
    }

    .button:hover::before, .button:hover::after {
      opacity: 1;
      visibility: visible;
    }

    .button:hover::after {
      bottom: calc(var(--height) + var(--gap-between-tooltip-to-button) - 12px);
    }

    .button:hover::before {
      bottom: calc(var(--height) + var(--gap-between-tooltip-to-button));
    }
  `],
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Input() wishlisted = false;
  @Output() wishlistToggle = new EventEmitter<Product>();

  private cart = inject(CartService);
  private toast = inject(ToastService);

  categoryName(): string {
    const cats = this.product.categories;
    if (!cats?.length) return '';
    const c = cats[0];
    return typeof c === 'object' && c ? (c as any).name : '';
  }

  discountPct(): number {
    const cp = this.product.comparePrice || 0;
    if (!cp || cp <= this.product.price) return 0;
    return Math.round(((cp - this.product.price) / cp) * 100);
  }

  onAdd(ev: Event) {
    ev.preventDefault();
    ev.stopPropagation();
    this.cart.add(this.product, 1);
    this.toast.success(`Đã thêm "${this.product.name}" vào giỏ`);
  }

  onImgError(ev: Event) {
    (ev.target as HTMLImageElement).style.visibility = 'hidden';
  }

  onImg2Error(ev: Event) {
    (ev.target as HTMLImageElement).remove();
  }

  onWishlist(ev: Event) {
    ev.preventDefault();
    ev.stopPropagation();
    this.wishlistToggle.emit(this.product);
  }
}
