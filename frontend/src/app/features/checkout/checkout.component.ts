import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { OrdersService } from '../../core/services/orders.service';
import { ToastService } from '../../core/services/toast.service';
import { VndPipe } from '../../shared/pipes/vnd.pipe';
import { LocationIconComponent } from '../../shared/icons/location-icon.component';
import { CardIconComponent } from '../../shared/icons/card-icon.component';
import { PaymentMethod } from '../../core/models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    VndPipe,
    LocationIconComponent,
    CardIconComponent,
  ],
  template: `
    <div class="container-app py-lg">
      <h1 class="text-headline-md mb-lg">Thanh toán</h1>

      <div class="grid lg:grid-cols-[1fr_400px] gap-xl">
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-lg">
          <!-- Shipping -->
          <section class="card p-lg">
            <h2 class="text-headline-sm mb-md flex items-center gap-sm">
              <app-icon-location [size]="20" class="text-primary" /> Thông tin giao hàng
            </h2>
            <div formGroupName="shippingAddress" class="grid md:grid-cols-2 gap-md">
              <div class="md:col-span-2">
                <label class="label">Họ tên người nhận</label>
                <input formControlName="fullName" class="input" />
              </div>
              <div>
                <label class="label">Số điện thoại</label>
                <input formControlName="phone" class="input" />
              </div>
              <div>
                <label class="label">Tỉnh / Thành phố</label>
                <input formControlName="province" class="input" placeholder="TP. Hồ Chí Minh" />
              </div>
              <div>
                <label class="label">Quận / Huyện</label>
                <input formControlName="district" class="input" />
              </div>
              <div>
                <label class="label">Phường / Xã</label>
                <input formControlName="ward" class="input" />
              </div>
              <div class="md:col-span-2">
                <label class="label">Địa chỉ chi tiết</label>
                <input formControlName="line1" class="input" placeholder="Số nhà, tên đường" />
              </div>
            </div>
          </section>

          <!-- Payment -->
          <section class="card p-lg">
            <h2 class="text-headline-sm mb-md flex items-center gap-sm">
              <app-icon-card [size]="20" class="text-primary" /> Phương thức thanh toán
            </h2>
            <div class="space-y-sm">
              @for (m of methods; track m.value) {
                <label class="flex items-start gap-sm p-md rounded-md border-2 cursor-pointer transition-colors"
                  [class.border-primary]="form.value.paymentMethod === m.value"
                  [class.bg-primary-container]="form.value.paymentMethod === m.value"
                  [class.border-outline-variant]="form.value.paymentMethod !== m.value"
                >
                  <input type="radio" formControlName="paymentMethod" [value]="m.value" class="mt-xs" />
                  <div>
                    <p class="font-semibold">{{ m.label }}</p>
                    <p class="text-body-sm text-on-surface-variant">{{ m.desc }}</p>
                  </div>
                </label>
              }
            </div>
          </section>

          <!-- Note -->
          <section class="card p-lg">
            <h2 class="text-headline-sm mb-md">Ghi chú</h2>
            <textarea formControlName="note" rows="2" class="input" placeholder="Ghi chú thêm cho đơn hàng..."></textarea>
          </section>
        </form>

        <!-- Summary -->
        <aside class="lg:sticky lg:top-[88px] self-start space-y-md">
          <div class="card p-lg">
            <h2 class="text-headline-sm mb-md">Đơn hàng của bạn</h2>
            <div class="space-y-md max-h-[280px] overflow-y-auto pr-xs">
              @for (item of cart.cart().items; track item._id) {
                <div class="flex gap-sm items-center">
                  <img [src]="item.snapshot.image" alt="" class="w-[56px] h-[56px] rounded-md object-cover shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="text-body-sm line-clamp-1">{{ item.snapshot.name }}</p>
                    <p class="text-body-sm text-on-surface-variant">x{{ item.qty }} · {{ item.price | vnd }}</p>
                  </div>
                  <p class="font-semibold text-body-sm">{{ item.qty * item.price | vnd }}</p>
                </div>
              }
            </div>
            <div class="border-t border-outline-variant mt-md pt-md space-y-sm text-body-md">
              <div class="flex justify-between"><span class="text-on-surface-variant">Tạm tính</span><span>{{ cart.subtotal() | vnd }}</span></div>
              <div class="flex justify-between"><span class="text-on-surface-variant">Vận chuyển</span><span>{{ shipping() | vnd }}</span></div>
              <div class="flex justify-between font-display text-headline-sm pt-sm">
                <span>Tổng cộng</span><span class="text-primary">{{ total() | vnd }}</span>
              </div>
            </div>
            <button type="button" (click)="submit()" [disabled]="loading()" class="btn-primary btn-block mt-md">
              {{ loading() ? 'Đang đặt...' : 'Đặt hàng' }}
            </button>
          </div>
        </aside>
      </div>
    </div>
  `,
})
export class CheckoutComponent implements OnInit {
  cart = inject(CartService);
  private auth = inject(AuthService);
  private orders = inject(OrdersService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  loading = signal(false);

  methods: { value: PaymentMethod; label: string; desc: string }[] = [
    { value: 'cod', label: 'Thanh toán khi nhận hàng (COD)', desc: 'Trả tiền mặt khi nhận sản phẩm.' },
    { value: 'momo', label: 'Ví MoMo', desc: 'Thanh toán qua ví điện tử MoMo.' },
    { value: 'zalopay', label: 'ZaloPay', desc: 'Thanh toán qua ví điện tử ZaloPay.' },
  ];

  form = this.fb.nonNullable.group({
    shippingAddress: this.fb.nonNullable.group({
      fullName: ['', Validators.required],
      phone: ['', Validators.required],
      province: ['', Validators.required],
      district: [''],
      ward: [''],
      line1: ['', Validators.required],
    }),
    paymentMethod: ['cod' as PaymentMethod, Validators.required],
    note: [''],
  });

  ngOnInit() {
    this.cart.load();
    const user = this.auth.user();
    if (user) {
      const def = (user.addresses || []).find((a) => a.isDefault) || user.addresses?.[0];
      this.form.patchValue({
        shippingAddress: {
          fullName: def?.fullName || user.name,
          phone: def?.phone || user.phone || '',
          province: def?.province || '',
          district: def?.district || '',
          ward: def?.ward || '',
          line1: def?.line1 || '',
        },
      });
    }
  }

  shipping() {
    const s = this.cart.subtotal();
    return s >= 500000 || s === 0 ? 0 : 30000;
  }
  total() {
    return this.cart.subtotal() + this.shipping();
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.toast.error('Vui lòng điền đầy đủ thông tin giao hàng');
      return;
    }
    if (this.cart.cart().items.length === 0) {
      this.toast.error('Giỏ hàng trống');
      this.router.navigateByUrl('/gio-hang');
      return;
    }
    this.loading.set(true);
    this.orders.create(this.form.getRawValue() as any).subscribe({
      next: (res) => {
        this.cart.clear();
        this.toast.success(`Đặt hàng thành công — Mã đơn ${res.order.code}`);
        if (res.payment.payUrl) {
          window.location.href = res.payment.payUrl;
        } else {
          this.router.navigate(['/don-hang', res.order._id]);
        }
      },
      error: () => this.loading.set(false),
    });
  }
}
