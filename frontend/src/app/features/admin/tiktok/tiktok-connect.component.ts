import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TikTokAdminService } from '../../../core/services/tiktok-admin.service';
import { TikTokAccount } from '../../../core/models/tiktok.models';

@Component({
  selector: 'app-tiktok-connect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1 class="text-headline-md mb-lg">Kết nối TikTok Shop</h1>

    @if (error()) {
      <div class="p-md rounded-md bg-error-container text-on-error-container mb-md text-body-sm">
        {{ error() }}
      </div>
    }

    @if (loading()) {
      <p class="text-body-sm text-on-surface-variant">Đang tải...</p>
    } @else if (account()?.isConnected) {
      <div class="card p-lg mb-lg">
        <div class="flex items-center gap-md mb-md">
          <span class="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
          <span class="text-body-md font-semibold">Đã kết nối</span>
        </div>
        <dl class="grid grid-cols-2 gap-sm text-body-sm">
          <dt class="text-on-surface-variant">Tên shop</dt>
          <dd class="font-medium">{{ account()!.shopName || '—' }}</dd>
          <dt class="text-on-surface-variant">Shop ID</dt>
          <dd class="font-medium">{{ account()!.shopId }}</dd>
          <dt class="text-on-surface-variant">Access token hết hạn</dt>
          <dd class="font-medium">{{ account()!.accessTokenExpiresAt | date:'dd/MM/yyyy HH:mm' }}</dd>
          <dt class="text-on-surface-variant">Refresh token hết hạn</dt>
          <dd class="font-medium">{{ account()!.refreshTokenExpiresAt | date:'dd/MM/yyyy HH:mm' }}</dd>
          <dt class="text-on-surface-variant">Đồng bộ lần cuối</dt>
          <dd class="font-medium">{{ account()!.lastSyncAt ? (account()!.lastSyncAt! | date:'dd/MM/yyyy HH:mm') : 'Chưa bao giờ' }}</dd>
        </dl>
        @if (account()!.refreshTokenWarning) {
          <div class="mt-md p-sm rounded-md bg-warning-container text-warning-on-container text-body-sm">
            ⚠️ Refresh token sẽ hết hạn trong vòng 30 ngày. Hãy kết nối lại để tránh gián đoạn.
          </div>
        }
        <div class="mt-lg flex gap-sm">
          <button (click)="reconnect()" [disabled]="actionLoading()"
                  class="btn btn-secondary text-body-sm">
            Kết nối lại
          </button>
          <button (click)="disconnect()" [disabled]="actionLoading()"
                  class="btn btn-outline text-body-sm text-error">
            Ngắt kết nối
          </button>
        </div>
      </div>
    } @else {
      <div class="card p-lg max-w-md">
        <p class="text-body-sm text-on-surface-variant mb-lg">
          Kết nối TikTok Shop của bạn để đồng bộ sản phẩm, đơn hàng và tồn kho
          trực tiếp từ bảng điều khiển này.
        </p>
        <button (click)="connect()" [disabled]="actionLoading()"
                class="btn btn-primary w-full flex items-center justify-center gap-sm">
          @if (actionLoading()) {
            <span>Đang xử lý...</span>
          } @else {
            <span>Kết nối TikTok Shop</span>
          }
        </button>
      </div>
    }
  `,
})
export class TikTokConnectComponent implements OnInit {
  private svc = inject(TikTokAdminService);

  account = signal<(TikTokAccount & { isConnected: boolean }) | null>(null);
  loading = signal(true);
  actionLoading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadStatus();
  }

  loadStatus() {
    this.loading.set(true);
    this.svc.getStatus().subscribe({
      next: (data) => {
        this.account.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Không thể tải trạng thái kết nối');
        this.loading.set(false);
      },
    });
  }

  connect() {
    this.actionLoading.set(true);
    this.svc.initiateOAuth().subscribe({
      next: ({ authUrl }) => {
        window.location.href = authUrl;
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Không thể khởi động OAuth');
        this.actionLoading.set(false);
      },
    });
  }

  reconnect() {
    this.connect();
  }

  disconnect() {
    if (!confirm('Bạn có chắc muốn ngắt kết nối TikTok Shop?')) return;
    this.actionLoading.set(true);
    this.svc.disconnect().subscribe({
      next: () => {
        this.account.set(null);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Không thể ngắt kết nối');
        this.actionLoading.set(false);
      },
    });
  }
}
