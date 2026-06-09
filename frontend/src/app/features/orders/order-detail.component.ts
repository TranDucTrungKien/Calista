import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrdersService } from '../../core/services/orders.service';
import { ToastService } from '../../core/services/toast.service';
import { Order } from '../../core/models';
import { VndPipe } from '../../shared/pipes/vnd.pipe';
import { CheckCircleIconComponent } from '../../shared/icons/check-circle-icon.component';
import { PackageIconComponent } from '../../shared/icons/package-icon.component';
import { ChevronLeftIconComponent } from '../../shared/icons/chevron-left-icon.component';

const STATUS_ORDER = [
  'Chờ xác nhận',
  'Đã xác nhận',
  'Đang giao',
  'Đã giao',
];

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    VndPipe,
    CheckCircleIconComponent,
    PackageIconComponent,
    ChevronLeftIconComponent,
  ],
  template: `
    @if (order(); as o) {
    <div class="container-app py-lg">
      <a routerLink="/don-hang" class="inline-flex items-center gap-xs text-body-sm text-on-surface-variant hover:text-primary mb-md">
        <app-icon-chevron-left [size]="14" /> Quay lại danh sách
      </a>

      <div class="flex flex-wrap items-end justify-between gap-md mb-lg">
        <div>
          <h1 class="text-headline-md">Đơn hàng {{ o.code }}</h1>
          <p class="text-body-sm text-on-surface-variant">Đặt lúc {{ o.createdAt | date:'HH:mm dd/MM/yyyy' }}</p>
        </div>
        <span class="chip-attr">{{ o.orderStatus }}</span>
      </div>

      <!-- Status timeline -->
      @if (o.orderStatus !== 'Đã hủy') {
        <div class="card p-lg mb-lg">
          <div class="flex flex-wrap items-center gap-sm justify-between">
            @for (s of timeline; track s; let last = $last) {
              <div class="flex items-center gap-sm flex-1 min-w-[120px]">
                <div class="w-[32px] h-[32px] rounded-full flex items-center justify-center"
                  [class.bg-primary]="reached(s)"
                  [class.text-on-primary]="reached(s)"
                  [class.bg-surface-mid]="!reached(s)"
                  [class.text-on-surface-variant]="!reached(s)"
                >
                  @if (reached(s)) {
                    <app-icon-check-circle [size]="20" />
                  } @else {
                    <app-icon-package [size]="16" />
                  }
                </div>
                <span class="text-body-sm" [class.font-semibold]="reached(s)">{{ s }}</span>
                @if (!last) { <div class="flex-1 h-[1px] bg-outline-variant"></div> }
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="card p-md mb-lg bg-error-container/40 text-on-surface flex items-center gap-sm">
          <app-icon-package [size]="20" /> Đơn hàng đã được hủy.
        </div>
      }

      <div class="grid lg:grid-cols-[1fr_360px] gap-lg">
        <div class="space-y-md">
          <section class="card p-lg">
            <h2 class="text-headline-sm mb-md">Sản phẩm</h2>
            <div class="space-y-md">
              @for (it of o.items; track $index) {
                <div class="flex gap-sm items-center">
                  <img [src]="it.image" alt="" class="w-[64px] h-[64px] rounded-md object-cover" />
                  <div class="flex-1 min-w-0">
                    <p class="font-display text-[16px] line-clamp-1">{{ it.name }}</p>
                    <p class="text-body-sm text-on-surface-variant">x{{ it.qty }} · {{ it.price | vnd }}</p>
                  </div>
                  <p class="font-semibold">{{ it.qty * it.price | vnd }}</p>
                </div>
              }
            </div>
          </section>

          @if (o.statusHistory.length) {
            <section class="card p-lg">
              <h2 class="text-headline-sm mb-md">Lịch sử đơn hàng</h2>
              <ol class="space-y-sm">
                @for (h of o.statusHistory; track $index) {
                  <li class="flex gap-sm text-body-sm">
                    <span class="text-on-surface-variant whitespace-nowrap">{{ h.at | date:'HH:mm dd/MM' }}</span>
                    <span class="font-semibold">{{ h.status }}</span>
                    @if (h.note) { <span class="text-on-surface-variant">— {{ h.note }}</span> }
                  </li>
                }
              </ol>
            </section>
          }
        </div>

        <aside class="space-y-md">
          <section class="card p-lg">
            <h3 class="text-label-md uppercase mb-sm">Giao đến</h3>
            <p class="font-semibold">{{ o.shippingAddress.fullName }}</p>
            <p class="text-body-sm text-on-surface-variant">{{ o.shippingAddress.phone }}</p>
            <p class="text-body-sm mt-xs">{{ fullAddress(o) }}</p>
          </section>
          <section class="card p-lg">
            <h3 class="text-label-md uppercase mb-sm">Thanh toán</h3>
            <p class="text-body-md">{{ paymentLabel(o.paymentMethod) }}</p>
            <p class="text-body-sm text-on-surface-variant">{{ o.paymentStatus }}</p>
          </section>
          <section class="card p-lg space-y-sm">
            <div class="flex justify-between text-body-md"><span class="text-on-surface-variant">Tạm tính</span><span>{{ o.subtotal | vnd }}</span></div>
            <div class="flex justify-between text-body-md"><span class="text-on-surface-variant">Vận chuyển</span><span>{{ o.shippingFee | vnd }}</span></div>
            <div class="border-t border-outline-variant pt-sm flex justify-between font-display text-headline-sm">
              <span>Tổng cộng</span><span class="text-primary">{{ o.totalAmount | vnd }}</span>
            </div>
          </section>
          @if (o.orderStatus === 'Chờ xác nhận') {
            <button type="button" (click)="cancel(o._id)" class="btn-ghost btn-block">Hủy đơn hàng</button>
          }
        </aside>
      </div>
    </div>
    }
  `,
})
export class OrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private orders = inject(OrdersService);
  private toast = inject(ToastService);

  order = signal<Order | null>(null);
  timeline = STATUS_ORDER;

  ngOnInit() {
    this.route.paramMap.subscribe((p) => {
      const id = p.get('id')!;
      this.orders.detail(id).subscribe({
        next: (res) => this.order.set(res.order),
      });
    });
  }

  reached(s: string) {
    const o = this.order();
    if (!o) return false;
    const cur = STATUS_ORDER.indexOf(o.orderStatus);
    const idx = STATUS_ORDER.indexOf(s);
    return idx >= 0 && cur >= idx;
  }

  fullAddress(o: Order) {
    return [
      o.shippingAddress.line1,
      o.shippingAddress.ward,
      o.shippingAddress.district,
      o.shippingAddress.province,
    ]
      .filter(Boolean)
      .join(', ');
  }

  paymentLabel(m: string) {
    return { cod: 'COD - Tiền mặt khi nhận hàng', momo: 'Ví MoMo', zalopay: 'ZaloPay' }[
      m as 'cod' | 'momo' | 'zalopay'
    ] || m;
  }

  cancel(id: string) {
    if (!confirm('Bạn chắc chắn muốn hủy đơn hàng này?')) return;
    this.orders.cancel(id).subscribe({
      next: (res) => {
        this.order.set(res.order);
        this.toast.success('Đã hủy đơn hàng');
      },
    });
  }
}
