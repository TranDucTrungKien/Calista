import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopeeAdminService } from '../../../core/services/shopee-admin.service';
import { ShopeeProduct } from '../../../core/models/shopee.models';

@Component({
  selector: 'app-shopee-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center justify-between mb-lg">
      <h1 class="text-headline-md">Sản phẩm Shopee</h1>
      <select [(ngModel)]="selectedStatus" (ngModelChange)="onFilterChange()" class="input text-body-sm py-xs px-sm">
        <option value="">Tất cả</option>
        <option value="NORMAL">Đang bán</option>
        <option value="UNLIST">Ẩn</option>
        <option value="BANNED">Bị chặn</option>
      </select>
    </div>

    @if (error()) {
      <div class="p-md rounded-md bg-error-container text-on-error-container mb-md text-body-sm">{{ error() }}</div>
    }

    @if (loading()) {
      <p class="text-body-sm text-on-surface-variant">Đang tải...</p>
    } @else if (products().length === 0) {
      <div class="card p-lg text-center text-body-sm text-on-surface-variant">
        Chưa có sản phẩm. Hãy đồng bộ từ tab Đồng bộ.
      </div>
    } @else {
      <div class="space-y-sm">
        @for (p of products(); track p._id) {
          <div class="card p-md flex gap-md">
            @if (p.images[0]) {
              <img [src]="p.images[0]" [alt]="p.name" class="w-16 h-16 object-cover rounded-md flex-shrink-0" />
            }
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-sm">
                <p class="text-body-sm font-semibold truncate">{{ p.name }}</p>
                <span [class]="statusClass(p.status)" class="chip-attr text-[10px] flex-shrink-0">{{ statusLabel(p.status) }}</span>
              </div>
              <p class="text-body-xs text-on-surface-variant">Item ID: {{ p.shopeeItemId }}</p>
              <div class="flex items-center gap-md mt-xs text-body-xs">
                <span>{{ p.price | number:'1.0-0' }} {{ p.currency }}</span>
                @if (editingId() === p.shopeeItemId) {
                  <input type="number" [(ngModel)]="newStock" min="0" class="input w-20 text-body-xs py-xs px-sm" />
                  <button (click)="saveStock(p)" class="btn btn-primary text-[10px] py-xs px-sm">Lưu</button>
                  <button (click)="editingId.set(null)" class="btn btn-outline text-[10px] py-xs px-sm">Hủy</button>
                } @else {
                  <span class="font-medium">{{ p.stock }} tồn kho</span>
                  <button (click)="startEdit(p)" class="text-primary text-[10px] underline">Sửa</button>
                }
              </div>
            </div>
          </div>
        }
      </div>
      <div class="flex items-center justify-between mt-lg text-body-sm">
        <p class="text-on-surface-variant">Tổng: {{ total() }}</p>
        <div class="flex gap-xs">
          <button (click)="prevPage()" [disabled]="page() === 1" class="btn btn-outline text-body-xs py-xs px-sm">← Trước</button>
          <span class="px-sm py-xs">{{ page() }} / {{ totalPages() }}</span>
          <button (click)="nextPage()" [disabled]="page() >= totalPages()" class="btn btn-outline text-body-xs py-xs px-sm">Sau →</button>
        </div>
      </div>
    }
  `,
})
export class ShopeeProductsComponent implements OnInit {
  private svc = inject(ShopeeAdminService);
  products = signal<ShopeeProduct[]>([]);
  total = signal(0); page = signal(1); loading = signal(true);
  error = signal<string | null>(null); editingId = signal<number | null>(null); newStock = 0;
  selectedStatus = ''; readonly limit = 20;
  totalPages() { return Math.max(1, Math.ceil(this.total() / this.limit)); }
  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    this.svc.listProducts(this.page(), this.limit, this.selectedStatus || undefined).subscribe({
      next: (d) => { this.products.set(d.items); this.total.set(d.total); this.loading.set(false); },
      error: (e) => { this.error.set(e.error?.message || 'Lỗi'); this.loading.set(false); },
    });
  }
  onFilterChange() { this.page.set(1); this.load(); }
  prevPage() { if (this.page() > 1) { this.page.update(p => p - 1); this.load(); } }
  nextPage() { if (this.page() < this.totalPages()) { this.page.update(p => p + 1); this.load(); } }
  startEdit(p: ShopeeProduct) { this.editingId.set(p.shopeeItemId); this.newStock = p.stock; }
  saveStock(p: ShopeeProduct) {
    this.svc.updateInventory(p.shopeeItemId, this.newStock).subscribe({
      next: () => { this.products.update(ps => ps.map(x => x.shopeeItemId === p.shopeeItemId ? { ...x, stock: this.newStock } : x)); this.editingId.set(null); },
      error: (e) => this.error.set(e.error?.message || 'Lỗi'),
    });
  }
  statusLabel(s: string) { return { NORMAL: 'Đang bán', UNLIST: 'Ẩn', BANNED: 'Bị chặn', DELETED: 'Xóa' }[s] || s; }
  statusClass(s: string) { return { NORMAL: 'bg-green-100 text-green-800', UNLIST: 'bg-gray-100 text-gray-600', BANNED: 'bg-red-100 text-red-800' }[s] || ''; }
}
