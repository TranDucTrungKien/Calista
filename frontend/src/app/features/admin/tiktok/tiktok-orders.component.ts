import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TikTokAdminService } from '../../../core/services/tiktok-admin.service';
import { TikTokOrder, TikTokOrderStatus } from '../../../core/models/tiktok.models';

@Component({
  selector: 'app-tiktok-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center justify-between mb-lg">
      <h1 class="text-headline-md">Đơn hàng TikTok Shop</h1>
      <div class="flex gap-sm">
        <select [(ngModel)]="selectedStatus" (ngModelChange)="onFilterChange()"
                class="input text-body-sm py-xs px-sm">
          <option value="">Tất cả trạng thái</option>
          <option value="UNPAID">Chưa thanh toán</option>
          <option value="AWAITING_SHIPMENT">Chờ giao hàng</option>
          <option value="IN_TRANSIT">Đang vận chuyển</option>
          <option value="DELIVERED">Đã giao</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>
    </div>

    @if (error()) {
      <div class="p-md rounded-md bg-error-container text-on-error-container mb-md text-body-sm">
        {{ error() }}
      </div>
    }

    @if (loading()) {
      <p class="text-body-sm text-on-surface-variant">Đang tải đơn hàng...</p>
    } @else if (orders().length === 0) {
      <div class="card p-lg text-center text-body-sm text-on-surface-variant">
        Chưa có đơn hàng nào. Hãy đồng bộ từ tab Đồng bộ.
      </div>
    } @else {
      <div class="card overflow-hidden">
        <table class="w-full text-body-sm">
          <thead>
            <tr class="border-b border-outline-variant text-on-surface-variant text-left">
              <th class="p-sm">Mã đơn</th>
              <th class="p-sm">Người nhận</th>
              <th class="p-sm">Trạng thái</th>
              <th class="p-sm">Số tiền</th>
              <th class="p-sm">Ngày tạo</th>
              <th class="p-sm"></th>
            </tr>
          </thead>
          <tbody>
            @for (order of orders(); track order._id) {
              <tr class="border-b border-outline-variant hover:bg-surface-low cursor-pointer"
                  (click)="toggleExpand(order.tiktokOrderId)">
                <td class="p-sm font-semibold text-primary">{{ order.tiktokOrderId }}</td>
                <td class="p-sm">{{ order.recipientAddress?.name || '—' }}</td>
                <td class="p-sm">
                  <span [class]="statusClass(order.status)" class="chip-attr text-[10px]">
                    {{ statusLabel(order.status) }}
                  </span>
                </td>
                <td class="p-sm">{{ order.totalAmount | number:'1.0-0' }} {{ order.currency }}</td>
                <td class="p-sm text-on-surface-variant">{{ order.tiktokCreatedAt | date:'dd/MM/yyyy' }}</td>
                <td class="p-sm text-on-surface-variant text-right">
                  {{ expandedOrderId() === order.tiktokOrderId ? '▲' : '▼' }}
                </td>
              </tr>
              @if (expandedOrderId() === order.tiktokOrderId) {
                <tr>
                  <td colspan="6" class="p-md bg-surface-low text-body-xs">
                    <div class="grid md:grid-cols-2 gap-md">
                      <div>
                        <p class="font-semibold mb-xs">Sản phẩm</p>
                        @for (item of order.items; track item.tiktokSkuId) {
                          <p>{{ item.title }} × {{ item.quantity }} — {{ item.salePrice | number:'1.0-0' }} {{ order.currency }}</p>
                        }
                      </div>
                      <div>
                        <p class="font-semibold mb-xs">Giao hàng</p>
                        <p>{{ order.recipientAddress?.fullAddress || '—' }}</p>
                        <p class="text-on-surface-variant">{{ order.recipientAddress?.phone }}</p>
                        @if (order.trackingNumber) {
                          <p class="mt-xs">Mã vận đơn: <span class="font-semibold">{{ order.trackingNumber }}</span></p>
                          <p class="text-on-surface-variant">{{ order.shippingProvider }}</p>
                        }
                      </div>
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-lg text-body-sm">
        <p class="text-on-surface-variant">Tổng: {{ total() }} đơn hàng</p>
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
export class TikTokOrdersComponent implements OnInit {
  private svc = inject(TikTokAdminService);

  orders = signal<TikTokOrder[]>([]);
  total = signal(0);
  page = signal(1);
  loading = signal(true);
  error = signal<string | null>(null);
  expandedOrderId = signal<string | null>(null);

  selectedStatus = '';
  readonly limit = 20;

  totalPages() {
    return Math.max(1, Math.ceil(this.total() / this.limit));
  }

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading.set(true);
    this.svc
      .listOrders({ page: this.page(), limit: this.limit, status: this.selectedStatus || undefined })
      .subscribe({
        next: (data) => {
          this.orders.set(data.items);
          this.total.set(data.total);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Không thể tải đơn hàng');
          this.loading.set(false);
        },
      });
  }

  onFilterChange() {
    this.page.set(1);
    this.loadOrders();
  }

  toggleExpand(orderId: string) {
    this.expandedOrderId.update((id) => (id === orderId ? null : orderId));
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadOrders();
    }
  }

  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.loadOrders();
    }
  }

  statusLabel(status: TikTokOrderStatus | string) {
    const map: Record<string, string> = {
      UNPAID: 'Chưa TT',
      ON_HOLD: 'Tạm giữ',
      AWAITING_SHIPMENT: 'Chờ giao',
      AWAITING_COLLECTION: 'Chờ lấy hàng',
      IN_TRANSIT: 'Đang ship',
      DELIVERED: 'Đã giao',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
    };
    return map[status] || status;
  }

  statusClass(status: string) {
    const map: Record<string, string> = {
      UNPAID: 'bg-yellow-100 text-yellow-800',
      AWAITING_SHIPMENT: 'bg-blue-100 text-blue-800',
      IN_TRANSIT: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      ON_HOLD: 'bg-orange-100 text-orange-800',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  }
}
