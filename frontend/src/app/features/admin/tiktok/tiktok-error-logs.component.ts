import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TikTokAdminService } from '../../../core/services/tiktok-admin.service';
import { TikTokSyncLog } from '../../../core/models/tiktok.models';

@Component({
  selector: 'app-tiktok-error-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center justify-between mb-lg">
      <h1 class="text-headline-md">Nhật ký đồng bộ</h1>
      <div class="flex gap-sm">
        <select [(ngModel)]="filterOperation" (ngModelChange)="onFilterChange()"
                class="input text-body-sm py-xs px-sm">
          <option value="">Tất cả hoạt động</option>
          <option value="sync_products">Đồng bộ sản phẩm</option>
          <option value="sync_orders">Đồng bộ đơn hàng</option>
          <option value="update_stock">Cập nhật tồn kho</option>
          <option value="token_refresh">Làm mới token</option>
          <option value="oauth_connect">Kết nối</option>
          <option value="webhook_received">Webhook</option>
        </select>
        <select [(ngModel)]="filterStatus" (ngModelChange)="onFilterChange()"
                class="input text-body-sm py-xs px-sm">
          <option value="">Tất cả kết quả</option>
          <option value="success">Thành công</option>
          <option value="error">Lỗi</option>
          <option value="skipped">Bỏ qua</option>
        </select>
      </div>
    </div>

    @if (loading()) {
      <p class="text-body-sm text-on-surface-variant">Đang tải nhật ký...</p>
    } @else if (logs().length === 0) {
      <div class="card p-lg text-center text-body-sm text-on-surface-variant">
        Không có nhật ký nào phù hợp bộ lọc.
      </div>
    } @else {
      <div class="card overflow-hidden">
        <table class="w-full text-body-sm">
          <thead>
            <tr class="border-b border-outline-variant text-on-surface-variant text-left">
              <th class="p-sm">Thời gian</th>
              <th class="p-sm">Hoạt động</th>
              <th class="p-sm">Kết quả</th>
              <th class="p-sm">Số mục</th>
              <th class="p-sm">Thời gian (ms)</th>
              <th class="p-sm">Nguồn</th>
              <th class="p-sm">Lỗi</th>
            </tr>
          </thead>
          <tbody>
            @for (log of logs(); track log._id) {
              <tr class="border-b border-outline-variant hover:bg-surface-low"
                  [class.bg-red-50]="log.status === 'error'">
                <td class="p-sm text-on-surface-variant whitespace-nowrap">
                  {{ log.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}
                </td>
                <td class="p-sm font-medium">{{ operationLabel(log.operation) }}</td>
                <td class="p-sm">
                  <span [class]="statusClass(log.status)" class="chip-attr text-[10px]">
                    {{ statusLabel(log.status) }}
                  </span>
                </td>
                <td class="p-sm text-center">{{ log.itemsAffected }}</td>
                <td class="p-sm text-center text-on-surface-variant">{{ log.durationMs || '—' }}</td>
                <td class="p-sm text-on-surface-variant">{{ triggeredByLabel(log.triggeredBy) }}</td>
                <td class="p-sm text-red-600 text-body-xs max-w-xs truncate">
                  {{ log.errorMessage || '—' }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-lg text-body-sm">
        <p class="text-on-surface-variant">Tổng: {{ total() }} bản ghi</p>
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
export class TikTokErrorLogsComponent implements OnInit {
  private svc = inject(TikTokAdminService);

  logs = signal<TikTokSyncLog[]>([]);
  total = signal(0);
  page = signal(1);
  loading = signal(true);

  filterOperation = '';
  filterStatus = '';
  readonly limit = 25;

  totalPages() {
    return Math.max(1, Math.ceil(this.total() / this.limit));
  }

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.loading.set(true);
    this.svc
      .getSyncLogs({
        page: this.page(),
        limit: this.limit,
        operation: this.filterOperation || undefined,
        status: this.filterStatus || undefined,
      })
      .subscribe({
        next: (data) => {
          this.logs.set(data.items);
          this.total.set(data.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onFilterChange() {
    this.page.set(1);
    this.loadLogs();
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadLogs();
    }
  }

  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.loadLogs();
    }
  }

  operationLabel(op: string) {
    const map: Record<string, string> = {
      oauth_connect: 'Kết nối TikTok',
      oauth_disconnect: 'Ngắt kết nối',
      token_refresh: 'Làm mới token',
      sync_products: 'Đồng bộ sản phẩm',
      sync_orders: 'Đồng bộ đơn hàng',
      sync_inventory: 'Đồng bộ tồn kho',
      webhook_received: 'Webhook nhận',
      update_stock: 'Cập nhật tồn kho',
      sync_seller: 'Thông tin shop',
    };
    return map[op] || op;
  }

  statusLabel(status: string) {
    const map: Record<string, string> = { success: 'Thành công', error: 'Lỗi', skipped: 'Bỏ qua' };
    return map[status] || status;
  }

  statusClass(status: string) {
    const map: Record<string, string> = {
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      skipped: 'bg-gray-100 text-gray-600',
    };
    return map[status] || '';
  }

  triggeredByLabel(src: string) {
    const map: Record<string, string> = {
      manual: 'Thủ công',
      cron: 'Tự động',
      webhook: 'Webhook',
      system: 'Hệ thống',
    };
    return map[src] || src;
  }
}
