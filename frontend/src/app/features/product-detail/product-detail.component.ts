import { Component, OnInit, OnDestroy, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../core/services/products.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { UsersService } from '../../core/services/users.service';
import { SeoService } from '../../core/services/seo.service';
import { SchemaService } from '../../core/services/schema.service';
import { Product, Review } from '../../core/models';
import { VndPipe } from '../../shared/pipes/vnd.pipe';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { StarFilledIconComponent } from '../../shared/icons/star-filled-icon.component';
import { StarIconComponent } from '../../shared/icons/star-icon.component';
import { HeartIconComponent } from '../../shared/icons/heart-icon.component';
import { HeartFilledIconComponent } from '../../shared/icons/heart-filled-icon.component';
import { PlusIconComponent } from '../../shared/icons/plus-icon.component';
import { MinusIconComponent } from '../../shared/icons/minus-icon.component';
import { ChevronRightIconComponent } from '../../shared/icons/chevron-right-icon.component';
import { DropletIconComponent } from '../../shared/icons/droplet-icon.component';
import { LeafIconComponent } from '../../shared/icons/leaf-icon.component';
import { CheckCircleIconComponent } from '../../shared/icons/check-circle-icon.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    VndPipe,
    ProductCardComponent,
    StarFilledIconComponent,
    StarIconComponent,
    HeartIconComponent,
    HeartFilledIconComponent,
    PlusIconComponent,
    MinusIconComponent,
    ChevronRightIconComponent,
    DropletIconComponent,
    LeafIconComponent,
    CheckCircleIconComponent,
  ],
  template: `
    @if (product(); as p) {
    <div class="container-app py-lg">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-xs text-body-sm text-on-surface-variant mb-md">
        <a routerLink="/" class="hover:text-primary">Trang chủ</a>
        <app-icon-chevron-right [size]="12" />
        <a routerLink="/san-pham" class="hover:text-primary">Sản phẩm</a>
        <app-icon-chevron-right [size]="12" />
        <span class="text-on-surface line-clamp-1">{{ p.name }}</span>
      </nav>

      <div class="grid md:grid-cols-2 gap-xl">
        <!-- Gallery -->
        <div>
          <div class="aspect-square rounded-lg overflow-hidden bg-surface-low mb-sm">
            <img [src]="p.images[activeImg()]" [alt]="p.name" class="w-full h-full object-cover" />
          </div>
          <div class="grid grid-cols-4 gap-sm">
            @for (img of p.images; track $index) {
              <button type="button" (click)="activeImg.set($index)"
                class="aspect-square rounded-md overflow-hidden border-2 transition-all"
                [class.border-primary]="activeImg() === $index"
                [class.border-transparent]="activeImg() !== $index"
              >
                <img [src]="img" alt="" class="w-full h-full object-cover" />
              </button>
            }
          </div>
        </div>

        <!-- Info -->
        <div>
          <p class="text-label-md uppercase text-primary mb-xs">{{ categoryName(p) }}</p>
          <h1 class="font-display text-headline-md mb-sm">{{ p.name }}</h1>

          @if (p.ratings.count > 0) {
            <div class="flex items-center gap-xs text-tertiary mb-md">
              @for (i of [1,2,3,4,5]; track i) {
                @if (i <= p.ratings.avg) {
                  <app-icon-star-filled [size]="18" />
                } @else {
                  <app-icon-star [size]="18" />
                }
              }
              <span class="text-on-surface text-body-sm ml-xs">{{ p.ratings.avg }}</span>
              <span class="text-on-surface-variant text-body-sm">({{ p.ratings.count }} đánh giá)</span>
            </div>
          }

          <div class="flex items-end gap-md mb-lg">
            <span class="text-display-lg-mob text-primary">{{ p.price | vnd }}</span>
            @if (p.comparePrice && p.comparePrice > p.price) {
              <span class="text-body-lg text-on-surface-variant line-through pb-[8px]">{{ p.comparePrice | vnd }}</span>
            }
          </div>

          <div class="flex flex-wrap gap-xs mb-lg">
            @for (s of p.skinTypes; track s) { <span class="chip-skin">{{ s }}</span> }
            @for (t of p.tags; track t) { <span class="chip-attr">{{ t }}</span> }
          </div>

          <div class="flex items-center gap-md mb-lg">
            <div class="flex items-center border border-outline-variant rounded-md overflow-hidden">
              <button type="button" (click)="qty = Math.max(1, qty-1)" class="w-[40px] h-[40px] flex items-center justify-center hover:bg-surface-mid">
                <app-icon-minus [size]="16" />
              </button>
              <input type="number" [(ngModel)]="qty" min="1" class="w-[60px] h-[40px] text-center outline-none bg-transparent" />
              <button type="button" (click)="qty = qty+1" class="w-[40px] h-[40px] flex items-center justify-center hover:bg-surface-mid">
                <app-icon-plus [size]="16" />
              </button>
            </div>
            <button type="button" (click)="addToCart()" class="btn-secondary flex-1">Thêm vào giỏ hàng</button>
            <button type="button" (click)="toggleWishlist()" class="w-[44px] h-[44px] flex items-center justify-center rounded-md border border-outline-variant hover:border-primary hover:text-primary transition-colors">
              @if (wishlisted()) {
                <app-icon-heart-filled [size]="20" class="text-error" />
              } @else {
                <app-icon-heart [size]="20" />
              }
            </button>
          </div>

          <button type="button" (click)="buyNow()" class="btn-primary btn-block mb-lg">Mua ngay</button>

          <div class="grid grid-cols-2 gap-md text-body-sm">
            <div class="flex items-center gap-sm">
              <app-icon-check-circle [size]="18" class="text-primary" /> Giao hàng toàn quốc
            </div>
            <div class="flex items-center gap-sm">
              <app-icon-leaf [size]="18" class="text-primary" /> 100% thuần chay
            </div>
            <div class="flex items-center gap-sm">
              <app-icon-droplet [size]="18" class="text-primary" /> Phù hợp da nhạy cảm
            </div>
            <div class="flex items-center gap-sm">
              <app-icon-check-circle [size]="18" class="text-primary" /> Đổi trả 7 ngày
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <section class="mt-xxl">
        <div class="border-b border-outline-variant flex gap-lg overflow-x-auto">
          @for (t of tabs; track t.id) {
            <button type="button" (click)="activeTab.set(t.id)"
              class="py-md text-body-md whitespace-nowrap border-b-2 transition-colors"
              [class.border-primary]="activeTab() === t.id"
              [class.text-primary]="activeTab() === t.id"
              [class.font-semibold]="activeTab() === t.id"
              [class.border-transparent]="activeTab() !== t.id"
              [class.text-on-surface-variant]="activeTab() !== t.id"
            >
              {{ t.label }}
            </button>
          }
        </div>

        <div class="py-lg">
          @if (activeTab() === 'description') {
            <p class="text-body-md text-on-surface-variant whitespace-pre-line">{{ p.description }}</p>
          }
          @if (activeTab() === 'ingredients') {
            <p class="text-body-md text-on-surface-variant whitespace-pre-line">{{ p.ingredients }}</p>
          }
          @if (activeTab() === 'howToUse') {
            <p class="text-body-md text-on-surface-variant whitespace-pre-line">{{ p.howToUse }}</p>
          }
          @if (activeTab() === 'reviews') {
            <div class="space-y-md">
              @if (auth.isAuthenticated()) {
                <form (submit)="submitReview($event)" class="card p-md">
                  <p class="text-label-md mb-sm uppercase">Viết đánh giá</p>
                  <div class="flex gap-xs mb-sm">
                    @for (i of [1,2,3,4,5]; track i) {
                      <button type="button" (click)="newRating = i" class="text-tertiary">
                        @if (i <= newRating) {
                          <app-icon-star-filled [size]="22" />
                        } @else {
                          <app-icon-star [size]="22" />
                        }
                      </button>
                    }
                  </div>
                  <textarea [(ngModel)]="newComment" name="comment" rows="3" class="input mb-sm" placeholder="Chia sẻ cảm nhận của bạn..."></textarea>
                  <button type="submit" class="btn-primary">Gửi đánh giá</button>
                </form>
              }

              @if (reviews().length === 0) {
                <p class="text-body-md text-on-surface-variant py-md">Chưa có đánh giá nào.</p>
              } @else {
                @for (r of reviews(); track r._id) {
                  <div class="card p-md">
                    <div class="flex items-center justify-between mb-xs">
                      <span class="font-semibold">{{ reviewerName(r) }}</span>
                      <span class="text-body-sm text-on-surface-variant">{{ r.createdAt | date:'dd/MM/yyyy' }}</span>
                    </div>
                    <div class="flex gap-[2px] text-tertiary mb-sm">
                      @for (i of [1,2,3,4,5]; track i) {
                        @if (i <= r.rating) {
                          <app-icon-star-filled [size]="14" />
                        } @else {
                          <app-icon-star [size]="14" />
                        }
                      }
                    </div>
                    <p class="text-body-md text-on-surface-variant">{{ r.comment }}</p>
                  </div>
                }
              }
            </div>
          }
        </div>
      </section>

      <!-- Related -->
      @if (related().length > 0) {
        <section class="mt-xxl">
          <h2 class="text-headline-md mb-lg">Có thể bạn cũng thích</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-md">
            @for (r of related(); track r._id) { <app-product-card [product]="r" /> }
          </div>
        </section>
      }
    </div>

    <!-- Sticky cart bar -->
    @if (stickyVisible()) {
      <div class="fixed bottom-0 inset-x-0 z-30 glass border-t border-outline-variant py-sm animate-slide-down">
        <div class="container-app flex items-center gap-md">
          <img [src]="p.images[0]" alt="" class="w-[48px] h-[48px] rounded-md object-cover" />
          <div class="flex-1 hidden md:block">
            <p class="font-display text-[18px] leading-tight line-clamp-1">{{ p.name }}</p>
            <p class="text-body-sm text-primary font-semibold">{{ p.price | vnd }}</p>
          </div>
          <button type="button" (click)="addToCart()" class="btn-secondary !py-[10px]">Thêm giỏ</button>
          <button type="button" (click)="buyNow()" class="btn-primary !py-[10px]">Mua ngay</button>
        </div>
      </div>
    }
    } @else if (loading()) {
      <div class="container-app py-xl">
        <div class="grid md:grid-cols-2 gap-xl">
          <div class="skeleton aspect-square"></div>
          <div class="space-y-md">
            <div class="skeleton h-[24px] w-[40%]"></div>
            <div class="skeleton h-[40px] w-[80%]"></div>
            <div class="skeleton h-[20px] w-[30%]"></div>
            <div class="skeleton h-[48px] w-[50%]"></div>
            <div class="skeleton h-[80px] w-full"></div>
          </div>
        </div>
      </div>
    }
  `,
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private products = inject(ProductsService);
  private cart = inject(CartService);
  auth = inject(AuthService);
  private toast = inject(ToastService);
  private users = inject(UsersService);
  private seo = inject(SeoService);
  private schema = inject(SchemaService);

  product = signal<Product | null>(null);
  related = signal<Product[]>([]);
  reviews = signal<Review[]>([]);
  activeImg = signal(0);
  activeTab = signal<'description' | 'ingredients' | 'howToUse' | 'reviews'>('description');
  loading = signal(true);
  stickyVisible = signal(false);
  wishlisted = signal(false);

  qty = 1;
  newRating = 5;
  newComment = '';
  Math = Math;

  tabs = [
    { id: 'description', label: 'Mô tả' },
    { id: 'ingredients', label: 'Thành phần' },
    { id: 'howToUse', label: 'Hướng dẫn dùng' },
    { id: 'reviews', label: 'Đánh giá' },
  ] as const;

  ngOnInit() {
    this.route.paramMap.subscribe((p) => {
      const slug = p.get('slug')!;
      this.loading.set(true);
      this.products.detail(slug).subscribe({
        next: (res) => {
          this.product.set(res.product);
          this.related.set(res.related);
          this.activeImg.set(0);
          this.loading.set(false);
          this.checkWishlist();
          this.loadReviews(res.product._id);
          this.applyProductSeo(res.product);
        },
        error: () => this.loading.set(false),
      });
    });
  }

  ngOnDestroy(): void {
    this.schema.remove();
  }

  private applyProductSeo(p: Product): void {
    const slug = p.slug ?? p._id;
    const canonical = `https://calista.vn/san-pham/${slug}`;
    const images = (p.images ?? []).map((img) =>
      img.startsWith('http') ? img : `https://calista.vn${img}`
    );
    const image = images[0] ?? '';

    this.seo.setPage({
      title: `${p.name} | Calista`,
      description: (p.description ?? '').slice(0, 120) || 'Mỹ phẩm thuần chay Calista',
      canonical,
      image,
      type: 'product',
    });

    const product: Record<string, unknown> = {
      '@type': 'Product',
      name: p.name,
      description: p.description ?? '',
      image: images,
      url: canonical,
      sku: slug,
      brand: { '@type': 'Brand', name: 'Calista' },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'VND',
        price: p.price,
        priceValidUntil: '2026-12-31',
        availability:
          (p.stock ?? 1) > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        url: canonical,
        seller: { '@type': 'Organization', '@id': 'https://calista.vn/#organization', name: 'Calista' },
      },
    };

    if (p.ratings?.count > 0) {
      product['aggregateRating'] = {
        '@type': 'AggregateRating',
        ratingValue: p.ratings.avg,
        reviewCount: p.ratings.count,
        bestRating: 5,
        worstRating: 1,
      };
    }

    this.schema.set({
      '@context': 'https://schema.org',
      '@graph': [
        product,
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: 'https://calista.vn/' },
            { '@type': 'ListItem', position: 2, name: 'Sản phẩm', item: 'https://calista.vn/san-pham' },
            { '@type': 'ListItem', position: 3, name: p.name, item: canonical },
          ],
        },
      ],
    });
  }

  loadReviews(productId: string) {
    this.products.reviews(productId).subscribe({
      next: (res) => this.reviews.set(res.items),
    });
  }

  checkWishlist() {
    const user = this.auth.user();
    const p = this.product();
    if (!user || !p) {
      this.wishlisted.set(false);
      return;
    }
    this.wishlisted.set((user.wishlist || []).includes(p._id));
  }

  categoryName(p: Product) {
    const c = p.categories?.[0];
    return typeof c === 'object' && c ? (c as any).name : '';
  }

  reviewerName(r: Review) {
    return typeof r.userId === 'object' ? r.userId.name : 'Khách hàng';
  }

  @HostListener('window:scroll')
  onScroll() {
    this.stickyVisible.set(window.scrollY > 600);
  }

  addToCart() {
    const p = this.product();
    if (!p) return;
    this.cart.add(p, this.qty);
    this.toast.success(`Đã thêm ${this.qty} "${p.name}" vào giỏ`);
  }

  buyNow() {
    this.addToCart();
    setTimeout(() => {
      this.router.navigateByUrl('/gio-hang');
    }, 350);
  }

  toggleWishlist() {
    const p = this.product();
    if (!p) return;
    if (!this.auth.isAuthenticated()) {
      this.toast.error('Vui lòng đăng nhập để sử dụng yêu thích');
      return;
    }
    this.users.toggleWishlist(p._id).subscribe({
      next: (res) => {
        this.wishlisted.set(res.added);
        const user = this.auth.user();
        if (user) {
          this.auth.setUser({ ...user, wishlist: res.wishlist });
        }
        this.toast.success(res.added ? 'Đã thêm vào yêu thích' : 'Đã bỏ khỏi yêu thích');
      },
    });
  }

  submitReview(ev: Event) {
    ev.preventDefault();
    const p = this.product();
    if (!p) return;
    if (!this.newComment.trim()) {
      this.toast.error('Vui lòng nhập nội dung đánh giá');
      return;
    }
    this.products
      .postReview(p._id, { rating: this.newRating, comment: this.newComment })
      .subscribe({
        next: () => {
          this.toast.success('Cảm ơn đánh giá của bạn');
          this.newComment = '';
          this.newRating = 5;
          this.loadReviews(p._id);
        },
      });
  }
}
