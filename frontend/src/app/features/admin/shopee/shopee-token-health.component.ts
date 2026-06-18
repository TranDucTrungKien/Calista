import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ShopeeAdminService } from '../../../core/services/shopee-admin.service';
import { ShopeeTokenHealth } from '../../../core/models/shopee.models';

@Component({
  selector: 'app-shopee-token-health',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <h1 class="text-headline-md mb-lg">Trạng thái Token Shopee</h1>
    @if (loading()) { <p class="text-body-sm text-on-surface-variant">Đang tải...</p> }
    @else if (!health()?.isConnected) {
      <div class="card p-lg max-w-md">
        <p class="text-body-sm mb-md">Chưa kết nối Shopee.</p>
        <a routerLink="/admin/shopee" class="btn btn-primary text-body-sm" style="background:#EE4D2D">Kết nối ngay</a>
      </div>
    } @else {
      <div class="grid md:grid-cols-2 gap-md">
        <div class="card p-lg">
          <p class="text-label-md uppercase text-on-surface-variant mb-sm">Access Token</p>
          <p class="text-body-md font-semibold mb-xs">Hết hạn: {{ health()!.accessTokenExpiresAt | date:'dd/MM/yyyy HH:mm' }}</p>
          <p class="text-body-sm text-on-surface-variant mb-sm">Còn {{ accessDaysLeft() }} ngày {{ accessHoursLeft() }} giờ</p>
          <span [class]="accessClass()" class="chip-attr text-[10px]">{{ accessStatus() }}</span>
        </div>
        <div class="card p-lg">
          <p class="text-label-md uppercase text-on-surface-variant mb-sm">Refresh Token</p>
          <p class="text-body-md font-semibold mb-xs">Hết hạn: {{ health()!.refreshTokenExpiresAt | date:'dd/MM/yyyy HH:mm' }}</p>
          <p class="text-body-sm text-on-surface-variant mb-sm">Còn {{ refreshDaysLeft() }} ngày</p>
          @if (health()!.refreshTokenWarning) { <span class="chip-attr bg-yellow-100 text-yellow-800 text-[10px]">Sắp hết hạn</span> }
          @else { <span class="chip-attr bg-green-100 text-green-800 text-[10px]">Còn hiệu lực</span> }
        </div>
        <div class="card p-lg md:col-span-2">
          <p class="text-label-md uppercase text-on-surface-variant mb-sm">Thông tin Shop</p>
          <dl class="grid grid-cols-2 gap-sm text-body-sm">
            <dt class="text-on-surface-variant">Shop ID</dt><dd class="font-medium">{{ health()!.shopId }}</dd>
            <dt class="text-on-surface-variant">Khu vực</dt><dd class="font-medium">{{ health()!.region }}</dd>
            <dt class="text-on-surface-variant">Đồng bộ cuối</dt><dd class="font-medium">{{ health()!.lastSyncAt ? (health()!.lastSyncAt! | date:'dd/MM HH:mm') : 'Chưa' }}</dd>
          </dl>
        </div>
      </div>
    }
  `,
})
export class ShopeeTokenHealthComponent implements OnInit {
  private svc = inject(ShopeeAdminService);
  health = signal<ShopeeTokenHealth | null>(null); loading = signal(true);
  accessDaysLeft = computed(() => { const e = this.health()?.accessTokenExpiresAt; return e ? Math.max(0, Math.floor((new Date(e).getTime() - Date.now()) / 86400000)) : 0; });
  accessHoursLeft = computed(() => { const e = this.health()?.accessTokenExpiresAt; if (!e) return 0; const ms = new Date(e).getTime() - Date.now(); return Math.max(0, Math.floor((ms % 86400000) / 3600000)); });
  refreshDaysLeft = computed(() => { const e = this.health()?.refreshTokenExpiresAt; return e ? Math.max(0, Math.floor((new Date(e).getTime() - Date.now()) / 86400000)) : 0; });
  accessStatus = computed(() => { const d = this.accessDaysLeft(); return d <= 0 ? 'Hết hạn' : d <= 0.5 ? 'Sắp hết' : 'Còn hiệu lực'; });
  accessClass = computed(() => { const d = this.accessDaysLeft(); return d <= 0 ? 'chip-attr bg-red-100 text-red-800 text-[10px]' : d <= 0.5 ? 'chip-attr bg-orange-100 text-orange-800 text-[10px]' : 'chip-attr bg-green-100 text-green-800 text-[10px]'; });
  ngOnInit() { this.svc.getTokenHealth().subscribe({ next: d => { this.health.set(d); this.loading.set(false); }, error: () => this.loading.set(false) }); }
}
