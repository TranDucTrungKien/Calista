import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersService } from '../../core/services/orders.service';
import { UsersService } from '../../core/services/users.service';
import { Order } from '../../core/models';
import { VndPipe } from '../../shared/pipes/vnd.pipe';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, VndPipe],
  template: `
    <h1 class="text-headline-md mb-lg">Tổng quan</h1>

    <div class="grid md:grid-cols-3 gap-md mb-lg">
      <div class="card p-lg">
        <p class="text-label-md uppercase text-on-surface-variant mb-xs">Tổng đơn hàng</p>
        <p class="font-display text-display-lg-mob text-primary">{{ orders().length }}</p>
      </div>
      <div class="card p-lg">
        <p class="text-label-md uppercase text-on-surface-variant mb-xs">Doanh thu</p>
        <p class="font-display text-display-lg-mob text-primary">{{ revenue() | vnd }}</p>
      </div>
      <div class="card p-lg">
        <p class="text-label-md uppercase text-on-surface-variant mb-xs">Tổng khách hàng</p>
        <p class="font-display text-display-lg-mob text-primary">{{ userCount() }}</p>
      </div>
    </div>

    <section class="card p-lg">
      <h2 class="text-headline-sm mb-md">Đơn hàng gần đây</h2>
      <table class="w-full text-body-sm">
        <thead>
          <tr class="border-b border-outline-variant text-on-surface-variant">
            <th class="text-left py-sm">Mã đơn</th>
            <th class="text-left py-sm">Khách</th>
            <th class="text-left py-sm">Trạng thái</th>
            <th class="text-right py-sm">Tổng</th>
          </tr>
        </thead>
        <tbody>
          @for (o of recent(); track o._id) {
            <tr class="border-b border-outline-variant">
              <td class="py-sm font-semibold">{{ o.code }}</td>
              <td class="py-sm">{{ o.shippingAddress.fullName }}</td>
              <td class="py-sm"><span class="chip-attr text-[10px]">{{ o.orderStatus }}</span></td>
              <td class="py-sm text-right">{{ o.totalAmount | vnd }}</td>
            </tr>
          }
        </tbody>
      </table>
    </section>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private ordersSvc = inject(OrdersService);
  private usersSvc = inject(UsersService);

  orders = signal<Order[]>([]);
  userCount = signal(0);

  recent() {
    return this.orders().slice(0, 10);
  }

  revenue() {
    return this.orders()
      .filter((o) => o.orderStatus !== 'Đã hủy')
      .reduce((s, o) => s + o.totalAmount, 0);
  }

  ngOnInit() {
    this.ordersSvc.adminList().subscribe({ next: (res) => this.orders.set(res.items) });
    this.usersSvc.adminList().subscribe({ next: (res) => this.userCount.set(res.items.length) });
  }
}
