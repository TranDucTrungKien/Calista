import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopeeAdminService } from '../../../core/services/shopee-admin.service';
import { ShopeeSyncLog } from '../../../core/models/shopee.models';

@Component({
  selector: 'app-shopee-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center justify-between mb-lg">
      <h1 class="text-headline-md">Nhật ký Shopee</h1>
      <div class="flex gap-sm">
        <select [(ngModel)]="filterOp" (ngModelChange)="onFilter()" class="input text-body-sm py-xs px-sm">
          <option value="">Tất cả</option>
          <option value="sync_products">Đồng bộ SP</option>
          <option value="sync_orders">Đồng bộ ĐH</option>
          <option value="update_stock">Cập nhật kho</option>
          <option value="token_refresh">Làm mới token</option>
          <option value="oauth_connect">Kết nối</option>
          <option value="webhook_received">Webhook</option>
        </select>
        <select [(ngModel)]="filterStatus" (ngModelChange)="onFilter()" class="input text-body-sm py-xs px-sm">
          <option value="">Tất cả</option>
          <option value="success">Thành công</option>
          <option value="error">Lỗi</option>
        </select>
      </div>
    </div>

    @if (loading()) { <p class="text-body-sm text-on-surface-variant">Đang tải...</p> }
    @else if (logs().length === 0) { <div class="card p-lg text-center text-body-sm text-on-surface-variant">Không có nhật ký nào.</div> }
    @else {
      <div class="card overflow-hidden">
        <table class="w-full text-body-sm">
          <thead><tr class="border-b border-outline-variant text-on-surface-variant text-left">
            <th class="p-sm">Thời gian</th><th class="p-sm">Hoạt động</th><th class="p-sm">KQ</th>
            <th class="p-sm">Mục</th><th class="p-sm">ms</th><th class="p-sm">Lỗi</th>
          </tr></thead>
          <tbody>
            @for (log of logs(); track log._id) {
              <tr class="border-b border-outline-variant" [class.bg-red-50]="log.status === 'error'">
                <td class="p-sm text-on-surface-variant whitespace-nowrap">{{ log.createdAt | date:'dd/MM HH:mm:ss' }}</td>
                <td class="p-sm font-medium">{{ opLabel(log.operation) }}</td>
                <td class="p-sm"><span [class]="log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" class="chip-attr text-[10px]">{{ log.status === 'success' ? 'OK' : 'Lỗi' }}</span></td>
                <td class="p-sm text-center">{{ log.itemsAffected }}</td>
                <td class="p-sm text-center text-on-surface-variant">{{ log.durationMs || '—' }}</td>
                <td class="p-sm text-red-600 text-body-xs max-w-xs truncate">{{ log.errorMessage || '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
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
export class ShopeeLogsComponent implements OnInit {
  private svc = inject(ShopeeAdminService);
  logs = signal<ShopeeSyncLog[]>([]); total = signal(0); page = signal(1); loading = signal(true);
  filterOp = ''; filterStatus = ''; readonly limit = 25;
  totalPages() { return Math.max(1, Math.ceil(this.total() / this.limit)); }
  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    this.svc.getSyncLogs({ page: this.page(), limit: this.limit, operation: this.filterOp || undefined, status: this.filterStatus || undefined }).subscribe({
      next: d => { this.logs.set(d.items); this.total.set(d.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
  onFilter() { this.page.set(1); this.load(); }
  prevPage() { if (this.page() > 1) { this.page.update(p => p - 1); this.load(); } }
  nextPage() { if (this.page() < this.totalPages()) { this.page.update(p => p + 1); this.load(); } }
  opLabel(op: string) { return { sync_products: 'Đồng bộ SP', sync_orders: 'Đồng bộ ĐH', update_stock: 'Cập nhật kho', token_refresh: 'Làm mới token', oauth_connect: 'Kết nối', webhook_received: 'Webhook' }[op] || op; }
}
