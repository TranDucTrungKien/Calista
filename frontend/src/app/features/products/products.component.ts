import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../core/services/products.service';
import { SeoService } from '../../core/services/seo.service';
import { SchemaService } from '../../core/services/schema.service';
import { Category, Product } from '../../core/models';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductCardSkeletonComponent } from '../../shared/components/product-card-skeleton/product-card-skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { FilterIconComponent } from '../../shared/icons/filter-icon.component';
import { CloseIconComponent } from '../../shared/icons/close-icon.component';
import { ChevronRightIconComponent } from '../../shared/icons/chevron-right-icon.component';

const SKIN_TYPES = ['Da dầu', 'Da khô', 'Da nhạy cảm', 'Da hỗn hợp', 'Da thường', 'Da mụn', 'Mọi loại da'];
const TAGS = ['Thuần chay', 'Chiết xuất thiên nhiên', 'Đặc trị', 'Chăm sóc chuyên sâu', 'Tẩy tế bào chết'];

const SORTS = [
  { value: 'createdAt:desc', label: 'Mới nhất' },
  { value: 'price:asc', label: 'Giá thấp đến cao' },
  { value: 'price:desc', label: 'Giá cao đến thấp' },
  { value: 'ratings.avg:desc', label: 'Đánh giá cao' },
];

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ProductCardComponent,
    ProductCardSkeletonComponent,
    EmptyStateComponent,
    FilterIconComponent,
    CloseIconComponent,
    ChevronRightIconComponent,
  ],
  template: `
    <div class="container-app py-lg">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-xs text-body-sm text-on-surface-variant mb-md">
        <a routerLink="/" class="hover:text-primary">Trang chủ</a>
        <app-icon-chevron-right [size]="12" />
        <span class="text-on-surface">Sản phẩm</span>
        @if (currentCategory()) {
          <app-icon-chevron-right [size]="12" />
          <span class="text-on-surface">{{ currentCategory()?.name }}</span>
        }
      </nav>

      <div class="flex items-end justify-between mb-lg">
        <div>
          <h1 class="text-headline-md">
            {{ currentCategory()?.name || (q() ? 'Kết quả: "' + q() + '"' : 'Tất cả sản phẩm') }}
          </h1>
          <p class="text-body-sm text-on-surface-variant mt-xs">{{ total() }} sản phẩm</p>
        </div>
        <div class="flex items-center gap-sm">
          <button type="button" (click)="filterOpen.set(true)" class="lg:hidden btn-ghost !py-[8px] !px-md">
            <app-icon-filter [size]="16" /> Lọc
          </button>
          <select [(ngModel)]="sort" (change)="apply()" class="input !py-[8px] !pr-xl text-body-sm w-auto">
            @for (s of sorts; track s.value) {
              <option [value]="s.value">{{ s.label }}</option>
            }
          </select>
        </div>
      </div>

      <div class="grid lg:grid-cols-[260px_1fr] gap-xl">
        <!-- Sidebar filter (desktop) -->
        <aside class="hidden lg:block space-y-lg sticky top-[88px] self-start">
          <div>
            <h3 class="text-label-md uppercase mb-sm">Danh mục</h3>
            <div class="space-y-xs">
              <button type="button" (click)="setCategory('')" class="block w-full text-left text-body-sm py-[6px] hover:text-primary"
                [class.text-primary]="!category()"
                [class.font-semibold]="!category()"
              >
                Tất cả
              </button>
              @for (c of categories(); track c._id) {
                <button type="button" (click)="setCategory(c.slug)" class="block w-full text-left text-body-sm py-[6px] hover:text-primary"
                  [class.text-primary]="category() === c.slug"
                  [class.font-semibold]="category() === c.slug"
                >
                  {{ c.name }}
                </button>
              }
            </div>
          </div>

          <div>
            <h3 class="text-label-md uppercase mb-sm">Loại da</h3>
            <div class="flex flex-wrap gap-xs">
              @for (s of skinTypes; track s) {
                <button type="button" (click)="toggleSkin(s)" class="chip-skin transition-all"
                  [class.opacity-40]="!skin().includes(s)"
                >
                  {{ s }}
                </button>
              }
            </div>
          </div>

          <div>
            <h3 class="text-label-md uppercase mb-sm">Thuộc tính</h3>
            <div class="flex flex-wrap gap-xs">
              @for (t of tags; track t) {
                <button type="button" (click)="toggleTag(t)" class="chip-attr transition-all"
                  [class.opacity-40]="!selectedTags().includes(t)"
                >
                  {{ t }}
                </button>
              }
            </div>
          </div>

          <div>
            <h3 class="text-label-md uppercase mb-sm">Khoảng giá (VNĐ)</h3>
            <div class="flex gap-sm">
              <input type="number" placeholder="Từ" class="input !py-[8px]" [(ngModel)]="minPrice" />
              <input type="number" placeholder="Đến" class="input !py-[8px]" [(ngModel)]="maxPrice" />
            </div>
            <button type="button" (click)="apply()" class="btn-primary btn-block mt-md">Áp dụng</button>
            <button type="button" (click)="reset()" class="text-body-sm text-on-surface-variant mt-sm hover:text-primary block">Xóa bộ lọc</button>
          </div>
        </aside>

        <!-- Drawer (mobile) -->
        @if (filterOpen()) {
          <div class="lg:hidden fixed inset-0 z-50 bg-black/40" (click)="filterOpen.set(false)">
            <aside class="absolute top-0 right-0 bottom-0 w-[88%] max-w-[360px] bg-background overflow-y-auto p-lg space-y-lg animate-slide-down" (click)="$event.stopPropagation()">
              <div class="flex items-center justify-between">
                <h3 class="text-headline-sm">Bộ lọc</h3>
                <button (click)="filterOpen.set(false)" class="p-sm rounded-full hover:bg-surface-mid">
                  <app-icon-close [size]="20" />
                </button>
              </div>
              <div>
                <h4 class="text-label-md uppercase mb-sm">Danh mục</h4>
                <div class="space-y-xs">
                  <button type="button" (click)="setCategory(''); filterOpen.set(false)" class="block w-full text-left text-body-sm py-[6px]">Tất cả</button>
                  @for (c of categories(); track c._id) {
                    <button type="button" (click)="setCategory(c.slug); filterOpen.set(false)" class="block w-full text-left text-body-sm py-[6px]">{{ c.name }}</button>
                  }
                </div>
              </div>
              <div>
                <h4 class="text-label-md uppercase mb-sm">Loại da</h4>
                <div class="flex flex-wrap gap-xs">
                  @for (s of skinTypes; track s) {
                    <button type="button" (click)="toggleSkin(s)" class="chip-skin transition-all" [class.opacity-40]="!skin().includes(s)">{{ s }}</button>
                  }
                </div>
              </div>
              <button type="button" (click)="apply(); filterOpen.set(false)" class="btn-primary btn-block">Xem kết quả</button>
            </aside>
          </div>
        }

        <!-- Grid -->
        <div>
          @if (loading()) {
            <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
              @for (_ of skeletons; track $index) { <app-product-card-skeleton /> }
            </div>
          } @else if (items().length === 0) {
            <app-empty-state title="Không tìm thấy sản phẩm" message="Hãy thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác." />
          } @else {
            <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
              @for (p of items(); track p._id) {
                <app-product-card [product]="p" />
              }
            </div>

            @if (pageCount() > 1) {
              <div class="flex justify-center items-center gap-xs mt-xl">
                @for (n of pages(); track n) {
                  <button type="button" (click)="goPage(n)" class="min-w-[36px] h-[36px] rounded-md border border-outline-variant hover:border-primary transition-colors text-body-sm"
                    [class.bg-primary]="n === page()"
                    [class.text-on-primary]="n === page()"
                    [class.border-primary]="n === page()"
                  >{{ n }}</button>
                }
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class ProductsComponent implements OnInit, OnDestroy {
  private products = inject(ProductsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private seo = inject(SeoService);
  private schema = inject(SchemaService);

  items = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  total = signal(0);
  page = signal(1);
  loading = signal(true);
  filterOpen = signal(false);

  category = signal<string>('');
  skin = signal<string[]>([]);
  selectedTags = signal<string[]>([]);
  q = signal<string>('');
  sort = 'createdAt:desc';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  limit = 12;

  skinTypes = SKIN_TYPES;
  tags = TAGS;
  sorts = SORTS;
  skeletons = Array(8);

  currentCategory = signal<Category | null>(null);

  ngOnInit() {
    this.products.categories().subscribe({
      next: (res) => {
        this.categories.set(res.items);
        this.syncCategory();
      },
    });
    this.route.queryParamMap.subscribe((p) => {
      this.category.set(p.get('category') || '');
      this.q.set(p.get('q') || '');
      this.sort = p.get('sort') || 'createdAt:desc';
      this.page.set(Number(p.get('page')) || 1);
      const skinParam = p.get('skinType');
      this.skin.set(skinParam ? skinParam.split(',').filter(Boolean) : []);
      const tagParam = p.get('tag');
      this.selectedTags.set(tagParam ? tagParam.split(',').filter(Boolean) : []);
      this.minPrice = p.get('minPrice') ? Number(p.get('minPrice')) : null;
      this.maxPrice = p.get('maxPrice') ? Number(p.get('maxPrice')) : null;
      this.syncCategory();
      this.fetch();
    });
  }

  syncCategory() {
    const slug = this.category();
    this.currentCategory.set(
      this.categories().find((c) => c.slug === slug) || null
    );
  }

  fetch() {
    this.loading.set(true);
    this.products
      .list({
        category: this.category() || undefined,
        skinType: this.skin().join(',') || undefined,
        tag: this.selectedTags().join(',') || undefined,
        minPrice: this.minPrice ?? undefined,
        maxPrice: this.maxPrice ?? undefined,
        q: this.q() || undefined,
        sort: this.sort,
        page: this.page(),
        limit: this.limit,
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.total.set(res.total);
          this.loading.set(false);
          this.applyListingSeo(res.items, res.total);
        },
        error: () => this.loading.set(false),
      });
  }

  ngOnDestroy(): void {
    this.schema.remove();
  }

  private applyListingSeo(items: Product[], total: number): void {
    const cat = this.currentCategory();
    const catName = cat?.name ?? 'Tất cả sản phẩm';
    const canonical = cat
      ? `https://calista.vn/san-pham?category=${cat.slug}`
      : 'https://calista.vn/san-pham';

    this.seo.setPage({
      title: cat ? `${catName} | Calista` : 'Sản phẩm | Calista',
      description: cat
        ? `Khám phá sản phẩm ${catName} thuần chay của Calista — chiết xuất thiên nhiên, an toàn cho mọi loại da.`
        : 'Khám phá toàn bộ sản phẩm mỹ phẩm thuần chay Calista — chiết xuất thiên nhiên, an toàn cho mọi loại da.',
      canonical,
    });

    this.schema.set({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${catName} — Calista`,
      url: canonical,
      numberOfItems: total,
      itemListElement: items.map((p, i) => ({
        '@type': 'ListItem',
        position: (this.page() - 1) * this.limit + i + 1,
        name: p.name,
        url: `https://calista.vn/san-pham/${p.slug}`,
      })),
    });
  }

  apply() {
    this.page.set(1);
    this.updateUrl();
  }

  reset() {
    this.skin.set([]);
    this.selectedTags.set([]);
    this.minPrice = null;
    this.maxPrice = null;
    this.sort = 'createdAt:desc';
    this.page.set(1);
    this.updateUrl();
  }

  setCategory(slug: string) {
    this.category.set(slug);
    this.page.set(1);
    this.updateUrl();
  }

  toggleSkin(s: string) {
    const arr = [...this.skin()];
    const i = arr.indexOf(s);
    if (i >= 0) arr.splice(i, 1);
    else arr.push(s);
    this.skin.set(arr);
    this.apply();
  }

  toggleTag(t: string) {
    const arr = [...this.selectedTags()];
    const i = arr.indexOf(t);
    if (i >= 0) arr.splice(i, 1);
    else arr.push(t);
    this.selectedTags.set(arr);
    this.apply();
  }

  goPage(n: number) {
    this.page.set(n);
    this.updateUrl();
  }

  pageCount() {
    return Math.max(1, Math.ceil(this.total() / this.limit));
  }

  pages(): number[] {
    return Array.from({ length: this.pageCount() }, (_, i) => i + 1);
  }

  private updateUrl() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        category: this.category() || null,
        q: this.q() || null,
        sort: this.sort !== 'createdAt:desc' ? this.sort : null,
        page: this.page() > 1 ? this.page() : null,
        skinType: this.skin().length ? this.skin().join(',') : null,
        tag: this.selectedTags().length ? this.selectedTags().join(',') : null,
        minPrice: this.minPrice ?? null,
        maxPrice: this.maxPrice ?? null,
      },
    });
  }
}
