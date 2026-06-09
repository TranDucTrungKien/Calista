import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrdersService } from '../../core/services/orders.service';
import { Order } from '../../core/models';
import { VndPipe } from '../../shared/pipes/vnd.pipe';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PackageIconComponent } from '../../shared/icons/package-icon.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    VndPipe,
    EmptyStateComponent,
    PackageIconComponent,
  ],
  template: `
    <div class="container-app py-lg">
      <h1 class="text-headline-md mb-lg">Đơn hàng của bạn</h1>
      @if (loading()) {
        <p class="text-body-md text-on-surface-variant">Đang tải...</p>
      } @else if (orders().length === 0) {
        <app-empty-state title="Chưa có đơn hàng nào" message="Hãy bắt đầu hành trình chăm sóc da với những sản phẩm Calista.">
          <a routerLink="/san-pham" class="btn-primary mt-md">Mua sắm ngay</a>
        </app-empty-state>
      } @else {
        <div class="space-y-md">
          @for (o of orders(); track o._id) {
            <a [routerLink]="['/don-hang', o._id]" class="card p-md flex flex-col md:flex-row md:items-center gap-md hover:shadow-soft transition-shadow">
              <div class="w-[56px] h-[56px] rounded-md bg-primary-container/50 flex items-center justify-center text-primary shrink-0">
                <app-icon-package [size]="24" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-sm">
                  <span class="font-display text-headline-sm">{{ o.code }}</span>
                  <span class="chip-attr text-[12px]">{{ o.orderStatus }}</span>
                </div>
                <p class="text-body-sm text-on-surface-variant mt-xs">
                  {{ o.items.length }} sản phẩm · {{ o.createdAt | date:'dd/MM/yyyy HH:mm' }}
                </p>
              </div>
              <div class="text-right">
                <p class="font-display text-headline-sm text-primary">{{ o.totalAmount | vnd }}</p>
                <p class="text-body-sm text-on-surface-variant">{{ paymentLabel(o) }}</p>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class OrdersComponent implements OnInit {
  private orders$ = inject(OrdersService);
  orders = signal<Order[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.orders$.listMine().subscribe({
      next: (res) => {
        this.orders.set(res.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  paymentLabel(o: Order) {
    const map: Record<string, string> = {
      cod: 'COD',
      momo: 'MoMo',
      zalopay: 'ZaloPay',
    };
    return map[o.paymentMethod] || o.paymentMethod;
  }
}
