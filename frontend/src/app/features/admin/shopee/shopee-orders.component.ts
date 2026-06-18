import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopeeAdminService } from '../../../core/services/shopee-admin.service';
import { ShopeeOrder } from '../../../core/models/shopee.models';

@Component({
  selector: 'app-shopee-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center justify-between mb-lg">
      <h1 class="text-headline-md">Đơn hàng Shopee</h1>
      <select [(ngModel)]="selectedStatus" (ngModelChange)="onFilterChange()" class="input text-body-sm py-xs px-sm">
        <option value="">Tất cả</option>
        <option value="UNPAID">Chưa thanh toán</option>
        <option value="READY_TO_SHIP">Chờ giao hàng</option>
        <option value="SHIPPED">Đang giao</option>
        <option value="COMPLETED">Hoàn thành</option>
        <option value="CANCELLED">Đã hủy</option>
      </select>
    </div>

    @if (loading()) {
      <p class="text-body-sm text-on-surface-variant">Đang tải...</p>
    } @else if (orders().length === 0) {
      <div class="card p-lg text-center text-body-sm text-on-surface-variant">Chưa có đơn hàng nào.</div>
    } @else {
      <div class="card overflow-hidden">
        <table class="w-full text-body-sm">
          <thead>
            <tr class="border-b border-outline-variant text-on-surface-variant text-left">
              <th class="p-sm">Mã đơn</th>
              <th class="p-sm">Người mua</th>
              <th class="p-sm">Trạng thái</th>
              <th class="p-sm">Số tiền</th>
              <th class="p-sm">Ngày tạo</th>
              <th class="p-sm"></th>
            </tr>
          </thead>
          <tbody>
            @for (o of orders(); track o._id) {
              <tr class="border-b border-outline-variant hover:bg-surface-low cursor-pointer" (click)="toggle(o.shopeeOrderSn)">
                <td class="p-sm font-semibold text-primary">{{ o.shopeeOrderSn }}</td>
                <td class="p-sm">{{ o.buyerUsername || '—' }}</td>
                <td class="p-sm"><span [class]="statusClass(o.orderStatus)" class="chip-attr text-[10px]">{{ statusLabel(o.orderStatus) }}</span></td>
                <td class="p-sm">{{ o.totalAmount | number:'1.0-0' }} {{ o.currency }}</td>
                <td class="p-sm text-on-surface-variant">{{ o.shopeeCreateTime | date:'dd/MM/yyyy' }}</td>
                <td class="p-sm text-right text-on-surface-variant">{{ expanded() === o.shopeeOrderSn ? '▲' : '▼' }}</td>
              </tr>
              @if (expanded() === o.shopeeOrderSn) {
                <tr><td colspan="6" class="p-md bg-surface-low text-body-xs">
                  <div class="grid md:grid-cols-2 gap-md">
                    <div>
                      <p class="font-semibold mb-xs">Sản phẩm</p>
                      @for (i of o.items; track i.shopeeItemId) {
                        <p>{{ i.name }} × {{ i.quantity }} — {{ i.price | number:'1.0-0' }} đ</p>
                      }
                    </div>
                    <div>
                      <p class="font-semibold mb-xs">Giao hàng</p>
                      <p>{{ o.recipientName }} — {{ o.recipientPhone }}</p>
                      <p class="text-on-surface-variant">{{ o.recipientAddress }}</p>
                    </div>
                  </div>
                </td></tr>
              }
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
export class ShopeeOrdersComponent implements OnInit {
  private svc = inject(ShopeeAdminService);
  orders = signal<ShopeeOrder[]>([]); total = signal(0); page = signal(1);
  loading = signal(true); expanded = signal<string | null>(null); selectedStatus = '';
  readonly limit = 20;
  totalPages() { return Math.max(1, Math.ceil(this.total() / this.limit)); }
  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    this.svc.listOrders({ page: this.page(), limit: this.limit, status: this.selectedStatus || undefined }).subscribe({
      next: (d) => { this.orders.set(d.items); this.total.set(d.total); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
  onFilterChange() { this.page.set(1); this.load(); }
  toggle(sn: string) { this.expanded.update(v => v === sn ? null : sn); }
  prevPage() { if (this.page() > 1) { this.page.update(p => p - 1); this.load(); } }
  nextPage() { if (this.page() < this.totalPages()) { this.page.update(p => p + 1); this.load(); } }
  statusLabel(s: string) { return { UNPAID: 'Chưa TT', READY_TO_SHIP: 'Chờ giao', SHIPPED: 'Đang giao', TO_CONFIRM_RECEIVE: 'Chờ xác nhận', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy', IN_CANCEL: 'Đang hủy' }[s] || s; }
  statusClass(s: string) { return { UNPAID: 'bg-yellow-100 text-yellow-800', READY_TO_SHIP: 'bg-blue-100 text-blue-800', SHIPPED: 'bg-indigo-100 text-indigo-800', COMPLETED: 'bg-green-100 text-green-800', CANCELLED: 'bg-red-100 text-red-800' }[s] || 'bg-gray-100 text-gray-600'; }
}
