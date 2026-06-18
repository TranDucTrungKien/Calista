import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ShopeeAdminService } from '../../../core/services/shopee-admin.service';
import { ShopeeAccount } from '../../../core/models/shopee.models';

@Component({
  selector: 'app-shopee-connect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1 class="text-headline-md mb-lg">Kết nối Shopee</h1>

    @if (successMsg()) {
      <div class="p-md rounded-md bg-primary-container text-on-primary-container mb-md text-body-sm">
        {{ successMsg() }}
      </div>
    }
    @if (error()) {
      <div class="p-md rounded-md bg-error-container text-on-error-container mb-md text-body-sm">
        {{ error() }}
      </div>
    }

    @if (loading()) {
      <p class="text-body-sm text-on-surface-variant">Đang tải...</p>
    } @else if (account()?.isConnected) {
      <div class="card p-lg mb-lg max-w-lg">
        <div class="flex items-center gap-md mb-md">
          <span class="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
          <span class="text-body-md font-semibold">Đã kết nối Shopee</span>
        </div>
        <dl class="grid grid-cols-2 gap-sm text-body-sm">
          <dt class="text-on-surface-variant">Shop ID</dt>
          <dd class="font-medium">{{ account()!.shopId }}</dd>
          <dt class="text-on-surface-variant">Tên shop</dt>
          <dd class="font-medium">{{ account()!.shopName || '—' }}</dd>
          <dt class="text-on-surface-variant">Khu vực</dt>
          <dd class="font-medium">{{ account()!.region }}</dd>
          <dt class="text-on-surface-variant">Token hết hạn</dt>
          <dd class="font-medium">{{ account()!.accessTokenExpiresAt | date:'dd/MM/yyyy HH:mm' }}</dd>
          <dt class="text-on-surface-variant">Đồng bộ lần cuối</dt>
          <dd class="font-medium">{{ account()!.lastSyncAt ? (account()!.lastSyncAt! | date:'dd/MM HH:mm') : 'Chưa' }}</dd>
        </dl>
        @if (account()!.refreshTokenWarning) {
          <div class="mt-md p-sm rounded-md bg-yellow-50 border border-yellow-200 text-body-sm text-yellow-800">
            ⚠️ Refresh token sắp hết hạn. Hãy kết nối lại.
          </div>
        }
        <div class="mt-lg flex gap-sm">
          <button (click)="connect()" [disabled]="actionLoading()" class="btn btn-secondary text-body-sm">
            Kết nối lại
          </button>
          <button (click)="disconnect()" [disabled]="actionLoading()" class="btn btn-outline text-body-sm text-error">
            Ngắt kết nối
          </button>
        </div>
      </div>
    } @else {
      <div class="card p-lg max-w-md">
        <div class="flex items-center gap-sm mb-md">
          <span class="text-2xl">🛒</span>
          <h2 class="text-headline-sm">Shopee Open Platform</h2>
        </div>
        <p class="text-body-sm text-on-surface-variant mb-md">
          Kết nối shop Shopee để đồng bộ sản phẩm và đơn hàng về website.
        </p>
        <div class="bg-surface-low rounded-md p-sm mb-lg text-body-xs text-on-surface-variant space-y-xs">
          <p>📋 <strong>Hướng dẫn:</strong></p>
          <p>1. Đăng ký tại <strong>open.shopee.vn</strong></p>
          <p>2. Lấy <strong>Partner ID</strong> và <strong>Partner Key</strong></p>
          <p>3. Điền vào <code>.env</code> rồi restart server</p>
          <p>4. Click nút bên dưới để kết nối</p>
        </div>
        <button (click)="connect()" [disabled]="actionLoading()"
                class="btn btn-primary w-full" style="background:#EE4D2D">
          @if (actionLoading()) { Đang xử lý... } @else { Kết nối Shopee Shop }
        </button>
      </div>
    }
  `,
})
export class ShopeeConnectComponent implements OnInit {
  private svc = inject(ShopeeAdminService);
  private route = inject(ActivatedRoute);

  account = signal<(ShopeeAccount & { isConnected: boolean }) | null>(null);
  loading = signal(true);
  actionLoading = signal(false);
  error = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  ngOnInit() {
    const connected = this.route.snapshot.queryParamMap.get('connected');
    const errParam = this.route.snapshot.queryParamMap.get('error');
    if (connected) this.successMsg.set('✅ Đã kết nối Shopee thành công!');
    if (errParam) this.error.set(decodeURIComponent(errParam));
    this.loadStatus();
  }

  loadStatus() {
    this.loading.set(true);
    this.svc.getStatus().subscribe({
      next: (data) => { this.account.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  connect() {
    this.actionLoading.set(true);
    this.svc.initiateOAuth().subscribe({
      next: ({ authUrl }) => { window.location.href = authUrl; },
      error: (err) => { this.error.set(err.error?.message || 'Không thể khởi động OAuth'); this.actionLoading.set(false); },
    });
  }

  disconnect() {
    if (!confirm('Bạn có chắc muốn ngắt kết nối Shopee?')) return;
    this.actionLoading.set(true);
    this.svc.disconnect().subscribe({
      next: () => { this.account.set(null); this.actionLoading.set(false); },
      error: (err) => { this.error.set(err.error?.message || 'Lỗi'); this.actionLoading.set(false); },
    });
  }
}
