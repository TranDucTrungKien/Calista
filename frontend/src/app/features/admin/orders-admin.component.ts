import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdersService } from '../../core/services/orders.service';
import { ToastService } from '../../core/services/toast.service';
import { Order, OrderStatus } from '../../core/models';
import { VndPipe } from '../../shared/pipes/vnd.pipe';

const STATUSES: OrderStatus[] = [
  'Chờ xác nhận',
  'Đã xác nhận',
  'Đang giao',
  'Đã giao',
  'Đã hủy',
];

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, VndPipe],
  template: `
    <h1 class="text-headline-md mb-lg">Quản lý đơn hàng</h1>
    <div class="card p-md">
      <table class="w-full text-body-sm">
        <thead>
          <tr class="border-b border-outline-variant text-on-surface-variant">
            <th class="text-left py-sm">Mã đơn</th>
            <th class="text-left py-sm">Khách</th>
            <th class="text-left py-sm">SP</th>
            <th class="text-right py-sm">Tổng</th>
            <th class="text-left py-sm">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          @for (o of orders(); track o._id) {
            <tr class="border-b border-outline-variant">
              <td class="py-sm font-semibold">{{ o.code }}</td>
              <td class="py-sm">{{ o.shippingAddress.fullName }}</td>
              <td class="py-sm">{{ o.items.length }}</td>
              <td class="py-sm text-right">{{ o.totalAmount | vnd }}</td>
              <td class="py-sm">
                <select [ngModel]="o.orderStatus" (ngModelChange)="updateStatus(o, $event)" class="input !py-[6px] text-body-sm">
                  @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
                </select>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class AdminOrdersComponent implements OnInit {
  private orders$ = inject(OrdersService);
  private toast = inject(ToastService);
  orders = signal<Order[]>([]);
  statuses = STATUSES;

  ngOnInit() {
    this.orders$.adminList().subscribe({ next: (r) => this.orders.set(r.items) });
  }

  updateStatus(o: Order, status: OrderStatus) {
    this.orders$.adminUpdateStatus(o._id, status).subscribe({
      next: (res) => {
        this.orders.update((arr) =>
          arr.map((x) => (x._id === o._id ? res.order : x))
        );
        this.toast.success('Đã cập nhật trạng thái đơn hàng');
      },
    });
  }
}
