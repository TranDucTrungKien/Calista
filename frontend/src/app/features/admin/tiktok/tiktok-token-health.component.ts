import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TikTokAdminService } from '../../../core/services/tiktok-admin.service';
import { TikTokTokenHealth } from '../../../core/models/tiktok.models';

@Component({
  selector: 'app-tiktok-token-health',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <h1 class="text-headline-md mb-lg">Trạng thái Token</h1>

    @if (loading()) {
      <p class="text-body-sm text-on-surface-variant">Đang tải...</p>
    } @else if (!health()?.isConnected) {
      <div class="card p-lg max-w-md">
        <p class="text-body-sm mb-md">Chưa kết nối TikTok Shop.</p>
        <a routerLink="/admin/tiktok" class="btn btn-primary text-body-sm">Kết nối ngay</a>
      </div>
    } @else {
      <div class="grid md:grid-cols-2 gap-md">
        <!-- Access Token Card -->
        <div class="card p-lg">
          <p class="text-label-md uppercase text-on-surface-variant mb-sm">Access Token</p>
          <p class="text-body-md font-semibold mb-xs">
            Hết hạn: {{ health()!.accessTokenExpiresAt | date:'dd/MM/yyyy HH:mm' }}
          </p>
          <p class="text-body-sm text-on-surface-variant mb-sm">
            Còn {{ accessDaysLeft() }} ngày {{ accessHoursLeft() }} giờ
          </p>
          <span [class]="accessTokenBadgeClass()">{{ accessTokenStatus() }}</span>
        </div>

        <!-- Refresh Token Card -->
        <div class="card p-lg">
          <p class="text-label-md uppercase text-on-surface-variant mb-sm">Refresh Token</p>
          <p class="text-body-md font-semibold mb-xs">
            Hết hạn: {{ health()!.refreshTokenExpiresAt | date:'dd/MM/yyyy HH:mm' }}
          </p>
          <p class="text-body-sm text-on-surface-variant mb-sm">
            Còn {{ refreshDaysLeft() }} ngày
          </p>
          @if (health()!.refreshTokenWarning) {
            <span class="chip-attr bg-yellow-100 text-yellow-800 text-[10px]">Sắp hết hạn</span>
          } @else {
            <span class="chip-attr bg-green-100 text-green-800 text-[10px]">Còn hiệu lực</span>
          }
        </div>

        <!-- Shop Info Card -->
        <div class="card p-lg md:col-span-2">
          <p class="text-label-md uppercase text-on-surface-variant mb-sm">Thông tin Shop</p>
          <dl class="grid grid-cols-2 gap-sm text-body-sm">
            <dt class="text-on-surface-variant">Tên shop</dt>
            <dd class="font-medium">{{ health()!.shopName || '—' }}</dd>
            <dt class="text-on-surface-variant">Shop ID</dt>
            <dd class="font-medium">{{ health()!.shopId || '—' }}</dd>
            <dt class="text-on-surface-variant">Đồng bộ lần cuối</dt>
            <dd class="font-medium">
              {{ health()!.lastSyncAt ? (health()!.lastSyncAt! | date:'dd/MM/yyyy HH:mm') : 'Chưa bao giờ' }}
            </dd>
          </dl>
        </div>
      </div>

      @if (health()!.refreshTokenWarning) {
        <div class="mt-md p-md rounded-md bg-yellow-50 border border-yellow-200 text-body-sm text-yellow-800">
          ⚠️ Refresh token sẽ hết hạn trong vòng 30 ngày.
          <a routerLink="/admin/tiktok" class="underline ml-xs">Kết nối lại ngay</a> để tránh mất quyền truy cập.
        </div>
      }
    }
  `,
})
export class TikTokTokenHealthComponent implements OnInit {
  private svc = inject(TikTokAdminService);

  health = signal<TikTokTokenHealth | null>(null);
  loading = signal(true);

  accessDaysLeft = computed(() => {
    const exp = this.health()?.accessTokenExpiresAt;
    if (!exp) return 0;
    return Math.max(0, Math.floor((new Date(exp).getTime() - Date.now()) / 86400000));
  });

  accessHoursLeft = computed(() => {
    const exp = this.health()?.accessTokenExpiresAt;
    if (!exp) return 0;
    const ms = new Date(exp).getTime() - Date.now();
    return Math.max(0, Math.floor((ms % 86400000) / 3600000));
  });

  refreshDaysLeft = computed(() => {
    const exp = this.health()?.refreshTokenExpiresAt;
    if (!exp) return 0;
    return Math.max(0, Math.floor((new Date(exp).getTime() - Date.now()) / 86400000));
  });

  accessTokenStatus = computed(() => {
    const days = this.accessDaysLeft();
    if (days <= 0) return 'Đã hết hạn';
    if (days <= 1) return 'Sắp hết hạn';
    return 'Còn hiệu lực';
  });

  accessTokenBadgeClass = computed(() => {
    const days = this.accessDaysLeft();
    if (days <= 0) return 'chip-attr bg-red-100 text-red-800 text-[10px]';
    if (days <= 1) return 'chip-attr bg-orange-100 text-orange-800 text-[10px]';
    return 'chip-attr bg-green-100 text-green-800 text-[10px]';
  });

  ngOnInit() {
    this.svc.getTokenHealth().subscribe({
      next: (data) => {
        this.health.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
