import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductsService } from '../../core/services/products.service';
import { SeoService } from '../../core/services/seo.service';
import { Category, Product } from '../../core/models';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductCardSkeletonComponent } from '../../shared/components/product-card-skeleton/product-card-skeleton.component';
import { SearchIconComponent } from '../../shared/icons/search-icon.component';
import { ChevronRightIconComponent } from '../../shared/icons/chevron-right-icon.component';
import { StarButtonDirective } from '../../shared/directives/star-button.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ProductCardComponent,
    ProductCardSkeletonComponent,
    SearchIconComponent,
    ChevronRightIconComponent,
    StarButtonDirective,
  ],
  template: `
    <!-- HERO -->
    <section class="relative overflow-hidden">
      <img
        src="/assets/images/coverpage.png"
        alt="Calista hero"
        class="w-full block"
      />
      <div class="absolute inset-0 bg-gradient-to-l from-black/40 via-transparent to-transparent"></div>
      <div class="absolute inset-y-0 right-0 w-1/2 flex items-center justify-center">
        <button
          type="button"
          routerLink="/san-pham"
          class="hero-flower-btn"
        >
          <div class="flower-wrapper">
            <p class="flower-text">EXPLORE</p>

            <div class="flower flower1">
              <div class="petal one"></div>
              <div class="petal two"></div>
              <div class="petal three"></div>
              <div class="petal four"></div>
            </div>
            <div class="flower flower2">
              <div class="petal one"></div>
              <div class="petal two"></div>
              <div class="petal three"></div>
              <div class="petal four"></div>
            </div>
            <div class="flower flower3">
              <div class="petal one"></div>
              <div class="petal two"></div>
              <div class="petal three"></div>
              <div class="petal four"></div>
            </div>
            <div class="flower flower4">
              <div class="petal one"></div>
              <div class="petal two"></div>
              <div class="petal three"></div>
              <div class="petal four"></div>
            </div>
            <div class="flower flower5">
              <div class="petal one"></div>
              <div class="petal two"></div>
              <div class="petal three"></div>
              <div class="petal four"></div>
            </div>
            <div class="flower flower6">
              <div class="petal one"></div>
              <div class="petal two"></div>
              <div class="petal three"></div>
              <div class="petal four"></div>
            </div>
          </div>
        </button>
      </div>
    </section>

    <!-- TRUST STRIP -->
    <section class="border-y border-outline-variant bg-surface-low">
      <div class="container-app py-md">
        <div class="grid grid-cols-3 md:grid-cols-3 divide-x divide-outline-variant text-center text-body-sm text-on-surface-variant">
          <div class="px-md py-sm">
            <p class="font-semibold text-on-surface text-[16px]">100%</p>
            <p>Thuần chay</p>
          </div>
          <div class="px-md py-sm">
            <p class="font-semibold text-on-surface text-[16px]">Miễn phí</p>
            <p>Ship đơn ≥ 500k</p>
          </div>
          <div class="px-md py-sm">
            <p class="font-semibold text-on-surface text-[16px]">Đổi 30 ngày</p>
            <p>Không câu hỏi</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CATEGORIES -->
    <section class="container-app py-xxl">
      <div class="flex items-end justify-between mb-lg">
        <div>
          <h2 class="text-headline-md">Khám phá theo danh mục</h2>
          <p class="text-body-sm text-on-surface-variant mt-xs">Tìm sản phẩm phù hợp với nhu cầu da của bạn</p>
        </div>
        <a routerLink="/san-pham" class="hidden md:flex items-center gap-xs text-body-sm font-semibold text-on-surface underline hover:text-primary transition-colors">
          Xem tất cả <app-icon-chevron-right [size]="14" />
        </a>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-sm">
        @for (c of categories(); track c._id) {
          <a
            [routerLink]="['/san-pham']"
            [queryParams]="{category: c.slug}"
            class="group relative aspect-square rounded-[14px] overflow-hidden bg-surface-mid"
          >
            <img [src]="c.image" [alt]="c.name" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <span class="absolute bottom-sm left-sm right-sm text-white text-[14px] font-semibold leading-tight">{{ c.name }}</span>
          </a>
        }
      </div>
    </section>

    <!-- FEATURED PRODUCTS -->
    <section class="container-app py-xxl">
      <div class="flex items-end justify-between mb-lg">
        <div>
          <h2 class="text-headline-md">Sản phẩm nổi bật</h2>
          <p class="text-body-sm text-on-surface-variant mt-xs">Được yêu thích nhất tháng này</p>
        </div>
        <a routerLink="/san-pham" [queryParams]="{featured:true}" class="text-body-sm font-semibold text-on-surface underline hover:text-primary transition-colors">Xem tất cả</a>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-sm">
        @if (loading()) {
          @for (_ of skeletons; track $index) {
            <app-product-card-skeleton />
          }
        } @else {
          @for (p of featured(); track p._id) {
            <app-product-card [product]="p" />
          }
        }
      </div>
    </section>

    <!-- STORY BANNER -->
    <section class="container-app py-xxl">
      <div class="rounded-[20px] overflow-hidden grid md:grid-cols-2 border border-outline-variant">
        <div class="p-xl md:p-xxl flex flex-col justify-center bg-surface-low">
          <span class="bg-primary text-on-primary text-[11px] font-semibold rounded-full px-sm py-[3px] self-start mb-md uppercase tracking-wider">Câu chuyện</span>
          <h2 class="text-headline-md mb-md">Khoa học gặp gỡ thiên nhiên</h2>
          <p class="text-body-md text-on-surface-variant mb-lg">
            Mỗi sản phẩm Calista đều được nghiên cứu kỹ lưỡng từ những nguyên liệu thực vật thuần khiết —
            được trồng và thu hoạch một cách bền vững.
          </p>
          <a routerLink="/ve-chung-toi" class="btn-ghost self-start rounded-full" appStarBtn>Tìm hiểu thêm</a>
        </div>
        <img
          src="https://picsum.photos/seed/calista-story/900/700"
          alt="Story"
          class="w-full h-full object-cover min-h-[280px]"
        />
      </div>
    </section>
  `,
  styles: [`
    .hero-flower-btn {
      height: 4em;
      width: 12em;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 0 solid black;
      cursor: pointer;
      transform: scale(1.8);
      transform-origin: center;
    }

    .flower-wrapper {
      height: 2em;
      width: 8em;
      position: relative;
      background: transparent;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .flower-text {
      font-family: 'MarvelCustom', Georgia, 'Times New Roman', serif;
      font-size: 35px;
      font-weight: 1200;
      letter-spacing: 0.05em;
      z-index: 1;
      color: #4f5836;
      -webkit-text-stroke: 0.6px rgba(255, 255, 255, 0.95);

      padding: 0px 8px;
      border-radius: 4px;
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all 0.5s ease;
    }

    .flower-text::after {
      content: '';
      display: block;
      flex: 0 0 auto;
      width: 10px;
      height: 10px;
      border-right: 2px solid #4f5836;
      border-bottom: 2px solid #4f5836;
      transform: rotate(-45deg);
      animation: explore-arrow-bounce 1.1s ease-in-out infinite;
    }

    @keyframes explore-arrow-bounce {
      0%,
      100% {
        transform: translateX(-3px) rotate(-45deg);
        opacity: 0.55;
      }

      50% {
        transform: translateX(3px) rotate(-45deg);
        opacity: 1;
      }
    }

    .flower {
      display: grid;
      grid-template-columns: 1em 1em;
      position: absolute;
      transition: grid-template-columns 0.8s ease;
    }

    .flower1 {
      top: -12px;
      left: -13px;
      transform: rotate(5deg);
    }

    .flower2 {
      bottom: -5px;
      left: 8px;
      transform: rotate(35deg);
    }

    .flower3 {
      bottom: -15px;
      transform: rotate(0deg);
    }

    .flower4 {
      top: -14px;
      transform: rotate(15deg);
    }

    .flower5 {
      right: 11px;
      top: -3px;
      transform: rotate(25deg);
    }

    .flower6 {
      right: -15px;
      bottom: -15px;
      transform: rotate(30deg);
    }

    .petal {
      height: 1em;
      width: 1em;
      border-radius: 40% 70% / 7% 90%;
      background: linear-gradient(#b8caaa, #d7e8c8);
      border: 0.5px solid #c6d5b8;
      z-index: 0;
      transition: width 0.8s ease, height 0.8s ease;
    }

    .two {
      transform: rotate(90deg);
    }

    .three {
      transform: rotate(270deg);
    }

    .four {
      transform: rotate(180deg);
    }

    .hero-flower-btn:hover .petal {
      background: linear-gradient(#748866, #b7c9aa);
      border: 0.5px solid #a9ba9b;
    }

    .hero-flower-btn:hover .flower {
      grid-template-columns: 1.5em 1.5em;
    }

    .hero-flower-btn:hover .flower .petal {
      width: 1.5em;
      height: 1.5em;
    }


    .hero-flower-btn:hover div.flower1 {
      animation: 15s linear 0s normal none infinite running flower1;
    }

    @keyframes flower1 {
      0% {
        transform: rotate(5deg);
      }

      100% {
        transform: rotate(365deg);
      }
    }

    .hero-flower-btn:hover div.flower2 {
      animation: 13s linear 1s normal none infinite running flower2;
    }

    @keyframes flower2 {
      0% {
        transform: rotate(35deg);
      }

      100% {
        transform: rotate(-325deg);
      }
    }

    .hero-flower-btn:hover div.flower3 {
      animation: 16s linear 1s normal none infinite running flower3;
    }

    @keyframes flower3 {
      0% {
        transform: rotate(0deg);
      }

      100% {
        transform: rotate(360deg);
      }
    }

    .hero-flower-btn:hover div.flower4 {
      animation: 17s linear 1s normal none infinite running flower4;
    }

    @keyframes flower4 {
      0% {
        transform: rotate(15deg);
      }

      100% {
        transform: rotate(375deg);
      }
    }

    .hero-flower-btn:hover div.flower5 {
      animation: 20s linear 1s normal none infinite running flower5;
    }

    @keyframes flower5 {
      0% {
        transform: rotate(25deg);
      }

      100% {
        transform: rotate(-335deg);
      }
    }

    .hero-flower-btn:hover div.flower6 {
      animation: 15s linear 1s normal none infinite running flower6;
    }

    @keyframes flower6 {
      0% {
        transform: rotate(30deg);
      }

      100% {
        transform: rotate(390deg);
      }
    }
  `],
})
export class HomeComponent implements OnInit {
  private products = inject(ProductsService);
  private seo = inject(SeoService);

  categories = signal<Category[]>([]);
  featured = signal<Product[]>([]);
  loading = signal(true);
  skeletons = Array(4);

  ngOnInit() {
    this.seo.setPage({
      title: 'Calista | Mỹ Phẩm Thuần Chay Thiên Nhiên',
      description: 'Khám phá bộ sưu tập mỹ phẩm thuần chay Calista — chiết xuất thiên nhiên, an toàn cho mọi loại da, giao hàng toàn quốc.',
      canonical: 'https://calista.vn/',
    });
    this.products.categories().subscribe({
      next: (res) => this.categories.set(res.items),
    });
    this.products.list({ featured: true, limit: 8 }).subscribe({
      next: (res) => {
        this.featured.set(res.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
