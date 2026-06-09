import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TikTokAdminService } from '../../../core/services/tiktok-admin.service';
import { TikTokProduct, TikTokSku } from '../../../core/models/tiktok.models';

@Component({
  selector: 'app-tiktok-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center justify-between mb-lg">
      <h1 class="text-headline-md">Sản phẩm TikTok Shop</h1>
      <div class="flex gap-sm">
        <select [(ngModel)]="selectedStatus" (ngModelChange)="onFilterChange()"
                class="input text-body-sm py-xs px-sm">
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVATE">Đang bán</option>
          <option value="SOLD_OUT">Hết hàng</option>
          <option value="INACTIVE">Ẩn</option>
        </select>
      </div>
    </div>

    @if (error()) {
      <div class="p-md rounded-md bg-error-container text-on-error-container mb-md text-body-sm">
        {{ error() }}
      </div>
    }

    @if (loading()) {
      <p class="text-body-sm text-on-surface-variant">Đang tải sản phẩm...</p>
    } @else if (products().length === 0) {
      <div class="card p-lg text-center text-body-sm text-on-surface-variant">
        Chưa có sản phẩm nào. Hãy đồng bộ từ tab Đồng bộ.
      </div>
    } @else {
      <div class="space-y-sm">
        @for (product of products(); track product._id) {
          <div class="card p-md">
            <div class="flex gap-md">
              @if (product.images[0]) {
                <img [src]="product.images[0]" [alt]="product.title"
                     class="w-16 h-16 object-cover rounded-md flex-shrink-0" />
              }
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-sm">
                  <p class="text-body-sm font-semibold truncate">{{ product.title }}</p>
                  <span [class]="statusClass(product.status)" class="chip-attr text-[10px] flex-shrink-0">
                    {{ statusLabel(product.status) }}
                  </span>
                </div>
                <p class="text-body-xs text-on-surface-variant mb-sm">
                  ID: {{ product.tiktokProductId }} · Đồng bộ: {{ product.syncedAt | date:'dd/MM HH:mm' }}
                </p>

                <!-- SKU rows -->
                <div class="space-y-xs">
                  @for (sku of product.skus; track sku.skuId) {
                    <div class="flex items-center justify-between gap-sm text-body-xs">
                      <span class="text-on-surface-variant min-w-0 truncate">
                        {{ sku.skuName || 'Mặc định' }} —
                        {{ sku.price | number:'1.0-0' }} {{ sku.currencyCode }}
                      </span>
                      <div class="flex items-center gap-xs flex-shrink-0">
                        @if (editingSkuId() === sku.skuId) {
                          <input type="number" [(ngModel)]="newStockValue" min="0"
                                 class="input w-20 text-body-xs py-xs px-sm" />
                          <button (click)="saveStock(product, sku)"
                                  [disabled]="savingStockId() === sku.skuId"
                                  class="btn btn-primary text-[10px] py-xs px-sm">
                            Lưu
                          </button>
                          <button (click)="cancelEdit()" class="btn btn-outline text-[10px] py-xs px-sm">
                            Hủy
                          </button>
                        } @else {
                          <span class="font-medium">{{ sku.stock }} tồn kho</span>
                          <button (click)="startEdit(sku)"
                                  class="text-primary text-[10px] underline">
                            Sửa
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-lg text-body-sm">
        <p class="text-on-surface-variant">Tổng: {{ total() }} sản phẩm</p>
        <div class="flex gap-xs">
          <button (click)="prevPage()" [disabled]="page() === 1"
                  class="btn btn-outline text-body-xs py-xs px-sm">← Trước</button>
          <span class="px-sm py-xs">{{ page() }} / {{ totalPages() }}</span>
          <button (click)="nextPage()" [disabled]="page() >= totalPages()"
                  class="btn btn-outline text-body-xs py-xs px-sm">Sau →</button>
        </div>
      </div>
    }
  `,
})
export class TikTokProductsComponent implements OnInit {
  private svc = inject(TikTokAdminService);

  products = signal<TikTokProduct[]>([]);
  total = signal(0);
  page = signal(1);
  loading = signal(true);
  error = signal<string | null>(null);

  selectedStatus = '';
  editingSkuId = signal<string | null>(null);
  newStockValue = 0;
  savingStockId = signal<string | null>(null);

  readonly limit = 20;

  totalPages() {
    return Math.max(1, Math.ceil(this.total() / this.limit));
  }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading.set(true);
    this.svc
      .listProducts(this.page(), this.limit, this.selectedStatus || undefined)
      .subscribe({
        next: (data) => {
          this.products.set(data.items);
          this.total.set(data.total);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Không thể tải sản phẩm');
          this.loading.set(false);
        },
      });
  }

  onFilterChange() {
    this.page.set(1);
    this.loadProducts();
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadProducts();
    }
  }

  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.loadProducts();
    }
  }

  startEdit(sku: TikTokSku) {
    this.editingSkuId.set(sku.skuId);
    this.newStockValue = sku.stock;
  }

  cancelEdit() {
    this.editingSkuId.set(null);
  }

  saveStock(product: TikTokProduct, sku: TikTokSku) {
    this.savingStockId.set(sku.skuId);
    this.svc.updateInventory(product.tiktokProductId, sku.skuId, this.newStockValue).subscribe({
      next: () => {
        // Update local state
        this.products.update((prods) =>
          prods.map((p) =>
            p._id === product._id
              ? {
                  ...p,
                  skus: p.skus.map((s) =>
                    s.skuId === sku.skuId ? { ...s, stock: this.newStockValue } : s
                  ),
                }
              : p
          )
        );
        this.editingSkuId.set(null);
        this.savingStockId.set(null);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Không thể cập nhật tồn kho');
        this.savingStockId.set(null);
      },
    });
  }

  statusLabel(status: string) {
    const labels: Record<string, string> = {
      ACTIVATE: 'Đang bán',
      SOLD_OUT: 'Hết hàng',
      INACTIVE: 'Ẩn',
      DELETED: 'Đã xóa',
    };
    return labels[status] || status;
  }

  statusClass(status: string) {
    const classes: Record<string, string> = {
      ACTIVATE: 'bg-green-100 text-green-800',
      SOLD_OUT: 'bg-red-100 text-red-800',
      INACTIVE: 'bg-gray-100 text-gray-600',
      DELETED: 'bg-red-100 text-red-800',
    };
    return classes[status] || '';
  }
}
