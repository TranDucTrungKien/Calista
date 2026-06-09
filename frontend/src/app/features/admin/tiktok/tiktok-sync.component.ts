import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TikTokAdminService } from '../../../core/services/tiktok-admin.service';
import { TikTokSyncLog } from '../../../core/models/tiktok.models';

@Component({
  selector: 'app-tiktok-sync',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1 class="text-headline-md mb-lg">Đồng bộ dữ liệu</h1>

    @if (message()) {
      <div class="p-md rounded-md bg-primary-container text-on-primary-container mb-md text-body-sm">
        {{ message() }}
      </div>
    }

    @if (error()) {
      <div class="p-md rounded-md bg-error-container text-on-error-container mb-md text-body-sm">
        {{ error() }}
      </div>
    }

    <div class="grid md:grid-cols-2 gap-md mb-lg">
      <!-- Product sync card -->
      <div class="card p-lg">
        <h2 class="text-headline-sm mb-xs">Sản phẩm</h2>
        <p class="text-body-sm text-on-surface-variant mb-md">
          Tải toàn bộ danh sách sản phẩm từ TikTok Shop về cơ sở dữ liệu.
        </p>
        <button (click)="syncProducts()" [disabled]="syncing() !== null"
                class="btn btn-primary w-full text-body-sm">
          @if (syncing() === 'products') {
            Đang đồng bộ...
          } @else {
            Đồng bộ sản phẩm
          }
        </button>
        @if (lastProductLog()) {
          <p class="mt-sm text-body-xs text-on-surface-variant">
            Lần cuối: {{ lastProductLog()!.createdAt | date:'dd/MM HH:mm' }} —
            <span [class]="lastProductLog()!.status === 'success' ? 'text-green-700' : 'text-red-600'">
              {{ lastProductLog()!.status === 'success' ? 'Thành công' : 'Lỗi' }}
            </span>
            ({{ lastProductLog()!.itemsAffected }} mục)
          </p>
        }
      </div>

      <!-- Order sync card -->
      <div class="card p-lg">
        <h2 class="text-headline-sm mb-xs">Đơn hàng</h2>
        <p class="text-body-sm text-on-surface-variant mb-sm">
          Đồng bộ đơn hàng trong khoảng thời gian.
        </p>
        <div class="grid grid-cols-2 gap-xs mb-md">
          <div>
            <label class="text-body-xs text-on-surface-variant block mb-xs">Từ ngày</label>
            <input type="date" [(ngModel)]="orderSyncStart"
                   class="input text-body-sm py-xs px-sm w-full" />
          </div>
          <div>
            <label class="text-body-xs text-on-surface-variant block mb-xs">Đến ngày</label>
            <input type="date" [(ngModel)]="orderSyncEnd"
                   class="input text-body-sm py-xs px-sm w-full" />
          </div>
        </div>
        <button (click)="syncOrders()" [disabled]="syncing() !== null"
                class="btn btn-primary w-full text-body-sm">
          @if (syncing() === 'orders') {
            Đang đồng bộ...
          } @else {
            Đồng bộ đơn hàng
          }
        </button>
        @if (lastOrderLog()) {
          <p class="mt-sm text-body-xs text-on-surface-variant">
            Lần cuối: {{ lastOrderLog()!.createdAt | date:'dd/MM HH:mm' }} —
            <span [class]="lastOrderLog()!.status === 'success' ? 'text-green-700' : 'text-red-600'">
              {{ lastOrderLog()!.status === 'success' ? 'Thành công' : 'Lỗi' }}
            </span>
            ({{ lastOrderLog()!.itemsAffected }} mục)
          </p>
        }
      </div>
    </div>

    <!-- Recent activity -->
    <section class="card p-lg">
      <h2 class="text-headline-sm mb-md">Hoạt động gần đây</h2>
      @if (recentLogs().length === 0) {
        <p class="text-body-sm text-on-surface-variant">Chưa có hoạt động nào.</p>
      } @else {
        <div class="space-y-xs">
          @for (log of recentLogs(); track log._id) {
            <div class="flex items-center justify-between text-body-xs border-b border-outline-variant pb-xs">
              <div>
                <span class="font-medium">{{ operationLabel(log.operation) }}</span>
                <span class="text-on-surface-variant ml-sm">{{ log.createdAt | date:'dd/MM HH:mm' }}</span>
              </div>
              <div class="flex items-center gap-sm">
                <span class="text-on-surface-variant">{{ log.itemsAffected }} mục · {{ log.durationMs }}ms</span>
                <span [class]="log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                      class="chip-attr text-[10px]">
                  {{ log.status === 'success' ? 'OK' : 'Lỗi' }}
                </span>
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class TikTokSyncComponent implements OnInit {
  private svc = inject(TikTokAdminService);

  syncing = signal<'products' | 'orders' | null>(null);
  message = signal<string | null>(null);
  error = signal<string | null>(null);
  recentLogs = signal<TikTokSyncLog[]>([]);
  lastProductLog = signal<TikTokSyncLog | null>(null);
  lastOrderLog = signal<TikTokSyncLog | null>(null);

  orderSyncStart = '';
  orderSyncEnd = '';

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.svc.getSyncLogs({ limit: 10 }).subscribe({
      next: (data) => {
        this.recentLogs.set(data.items);
        this.lastProductLog.set(
          data.items.find((l) => l.operation === 'sync_products') || null
        );
        this.lastOrderLog.set(
          data.items.find((l) => l.operation === 'sync_orders') || null
        );
      },
      error: () => {},
    });
  }

  syncProducts() {
    this.syncing.set('products');
    this.message.set(null);
    this.error.set(null);
    this.svc.syncProducts().subscribe({
      next: (res) => {
        this.message.set(res.message);
        this.syncing.set(null);
        setTimeout(() => this.loadLogs(), 3000);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Không thể đồng bộ sản phẩm');
        this.syncing.set(null);
      },
    });
  }

  syncOrders() {
    this.syncing.set('orders');
    this.message.set(null);
    this.error.set(null);
    this.svc.syncOrders(this.orderSyncStart || undefined, this.orderSyncEnd || undefined).subscribe({
      next: (res) => {
        this.message.set(res.message);
        this.syncing.set(null);
        setTimeout(() => this.loadLogs(), 3000);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Không thể đồng bộ đơn hàng');
        this.syncing.set(null);
      },
    });
  }

  operationLabel(op: string) {
    const map: Record<string, string> = {
      sync_products: 'Đồng bộ sản phẩm',
      sync_orders: 'Đồng bộ đơn hàng',
      update_stock: 'Cập nhật tồn kho',
      token_refresh: 'Làm mới token',
      oauth_connect: 'Kết nối TikTok',
      oauth_disconnect: 'Ngắt kết nối',
      webhook_received: 'Webhook nhận được',
      sync_seller: 'Thông tin shop',
      sync_inventory: 'Đồng bộ tồn kho',
    };
    return map[op] || op;
  }
}
