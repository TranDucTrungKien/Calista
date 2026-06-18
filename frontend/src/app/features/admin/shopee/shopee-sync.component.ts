import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopeeAdminService } from '../../../core/services/shopee-admin.service';
import { ShopeeSyncLog } from '../../../core/models/shopee.models';

@Component({
  selector: 'app-shopee-sync',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1 class="text-headline-md mb-lg">Đồng bộ Shopee</h1>
    @if (message()) { <div class="p-md rounded-md bg-primary-container text-on-primary-container mb-md text-body-sm">{{ message() }}</div> }
    @if (error()) { <div class="p-md rounded-md bg-error-container text-on-error-container mb-md text-body-sm">{{ error() }}</div> }

    <div class="grid md:grid-cols-2 gap-md mb-lg">
      <div class="card p-lg">
        <h2 class="text-headline-sm mb-xs">Sản phẩm</h2>
        <p class="text-body-sm text-on-surface-variant mb-md">Tải danh sách sản phẩm từ Shopee.</p>
        <button (click)="syncProducts()" [disabled]="syncing() !== null" class="btn btn-primary w-full text-body-sm" style="background:#EE4D2D">
          @if (syncing() === 'products') { Đang đồng bộ... } @else { Đồng bộ sản phẩm }
        </button>
      </div>
      <div class="card p-lg">
        <h2 class="text-headline-sm mb-xs">Đơn hàng</h2>
        <div class="grid grid-cols-2 gap-xs mb-md">
          <div><label class="text-body-xs text-on-surface-variant block mb-xs">Từ ngày</label><input type="date" [(ngModel)]="startDate" class="input text-body-sm py-xs px-sm w-full" /></div>
          <div><label class="text-body-xs text-on-surface-variant block mb-xs">Đến ngày</label><input type="date" [(ngModel)]="endDate" class="input text-body-sm py-xs px-sm w-full" /></div>
        </div>
        <button (click)="syncOrders()" [disabled]="syncing() !== null" class="btn btn-primary w-full text-body-sm" style="background:#EE4D2D">
          @if (syncing() === 'orders') { Đang đồng bộ... } @else { Đồng bộ đơn hàng }
        </button>
      </div>
    </div>

    <section class="card p-lg">
      <h2 class="text-headline-sm mb-md">Hoạt động gần đây</h2>
      @if (logs().length === 0) { <p class="text-body-sm text-on-surface-variant">Chưa có hoạt động nào.</p> }
      @else {
        <div class="space-y-xs">
          @for (log of logs(); track log._id) {
            <div class="flex items-center justify-between text-body-xs border-b border-outline-variant pb-xs">
              <div><span class="font-medium">{{ opLabel(log.operation) }}</span><span class="text-on-surface-variant ml-sm">{{ log.createdAt | date:'dd/MM HH:mm' }}</span></div>
              <div class="flex items-center gap-sm">
                <span class="text-on-surface-variant">{{ log.itemsAffected }} mục</span>
                <span [class]="log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" class="chip-attr text-[10px]">{{ log.status === 'success' ? 'OK' : 'Lỗi' }}</span>
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class ShopeeSyncComponent implements OnInit {
  private svc = inject(ShopeeAdminService);
  syncing = signal<'products' | 'orders' | null>(null);
  message = signal<string | null>(null); error = signal<string | null>(null);
  logs = signal<ShopeeSyncLog[]>([]);
  startDate = ''; endDate = '';
  ngOnInit() { this.loadLogs(); }
  loadLogs() { this.svc.getSyncLogs({ limit: 10 }).subscribe({ next: d => this.logs.set(d.items), error: () => {} }); }
  syncProducts() {
    this.syncing.set('products'); this.message.set(null); this.error.set(null);
    this.svc.syncProducts().subscribe({
      next: r => { this.message.set(r.message); this.syncing.set(null); setTimeout(() => this.loadLogs(), 3000); },
      error: e => { this.error.set(e.error?.message || 'Lỗi'); this.syncing.set(null); },
    });
  }
  syncOrders() {
    this.syncing.set('orders'); this.message.set(null); this.error.set(null);
    this.svc.syncOrders(this.startDate || undefined, this.endDate || undefined).subscribe({
      next: r => { this.message.set(r.message); this.syncing.set(null); setTimeout(() => this.loadLogs(), 3000); },
      error: e => { this.error.set(e.error?.message || 'Lỗi'); this.syncing.set(null); },
    });
  }
  opLabel(op: string) { return { sync_products: 'Đồng bộ SP', sync_orders: 'Đồng bộ ĐH', update_stock: 'Cập nhật kho', token_refresh: 'Làm mới token', oauth_connect: 'Kết nối', webhook_received: 'Webhook' }[op] || op; }
}
