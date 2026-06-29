import {
  Component,
  Input,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { VietnamAddressService } from '../../../core/services/vietnam-address.service';

@Component({
  selector: 'app-address-fields',
  standalone: true,
  imports: [],
  styles: [`
    :host { display: block; }
    .map-shell {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      border: 1.5px solid #e0e0e0;
      box-shadow: 0 2px 12px rgba(0,0,0,.08);
    }
    .addr-map-el { height: 300px; width: 100%; background: #e8f0eb; }
    .map-overlay-btn {
      position: absolute;
      top: 10px; right: 10px;
      z-index: 500;
      display: inline-flex; align-items: center; gap: 6px;
      padding: 7px 14px;
      background: #fff;
      border: 1.5px solid #d0d0d0;
      border-radius: 20px;
      font-size: 13px; font-weight: 500;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,.12);
      transition: background .15s, box-shadow .15s;
      color: #333;
    }
    .map-overlay-btn:hover { background: #f7f7f7; box-shadow: 0 3px 12px rgba(0,0,0,.16); }
    .map-overlay-btn:disabled { opacity: .5; cursor: default; }
    .map-overlay-btn svg { color: #5a8a5e; }
    .map-tip {
      position: absolute;
      bottom: 10px; left: 50%; transform: translateX(-50%);
      z-index: 500;
      background: rgba(0,0,0,.65);
      color: #fff;
      font-size: 12px;
      padding: 5px 12px;
      border-radius: 20px;
      pointer-events: none;
      white-space: nowrap;
    }
    .addr-summary {
      display: flex; align-items: flex-start; gap: 8px;
      padding: 10px 14px;
      background: #f5f9f5;
      border-top: 1px solid #e5ede5;
      min-height: 44px;
    }
    .addr-summary svg { flex-shrink: 0; margin-top: 1px; color: #5a8a5e; }
    .addr-summary-text { font-size: 13.5px; line-height: 1.5; color: #333; }
    .addr-summary-text .dim { color: #888; font-size: 12px; }
  `],
  template: `
    <div class="map-shell">
      <div class="addr-map-el" #mapEl></div>

      <!-- Định vị lại button -->
      <button type="button" class="map-overlay-btn" [disabled]="locating()" (click)="locateMe()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
        </svg>
        {{ locating() ? 'Đang định vị...' : 'Định vị lại' }}
      </button>

      <!-- Tip shown when no pin yet -->
      @if (!hasPinned() && !locating()) {
        <div class="map-tip">Nhấn vào bản đồ để chọn vị trí</div>
      }

      <!-- Address summary bar -->
      <div class="addr-summary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="2.5"/>
        </svg>
        <div class="addr-summary-text">
          @if (locating()) {
            <span class="dim">Đang xác định vị trí...</span>
          } @else if (resolvedAddress()) {
            {{ resolvedAddress() }}
          } @else if (geoError()) {
            <span style="color:#c0392b">{{ geoError() }}</span>
          } @else {
            <span class="dim">Chưa có vị trí — nhấn bản đồ hoặc "Định vị lại"</span>
          }
        </div>
      </div>
    </div>
  `,
})
export class AddressFieldsComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) group!: FormGroup;
  @ViewChild('mapEl') mapEl!: ElementRef<HTMLDivElement>;

  private addrSvc    = inject(VietnamAddressService);
  private platformId = inject(PLATFORM_ID);

  locating        = signal(false);
  hasPinned       = signal(false);
  resolvedAddress = signal('');
  geoError        = signal('');

  // Leaflet instances kept as `any` to avoid SSR type issues
  private map:    any = null;
  private marker: any = null;
  private L:      any = null;

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    await this.initMap();
  }

  private async initMap() {
    // Dynamic import keeps Leaflet out of the SSR bundle
    const mod = await import('leaflet');
    this.L = (mod as any).default ?? mod;
    const L = this.L;

    this.map = L.map(this.mapEl.nativeElement, { zoomControl: true })
      .setView([16.05, 108.20], 6);   // Default: center of Vietnam

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    // Click on map → set/move pin
    this.map.on('click', (e: any) => {
      this.setPin(e.latlng.lat, e.latlng.lng);
    });

    // Ensure map tiles render correctly after parent layout is settled
    setTimeout(() => this.map?.invalidateSize(), 150);

    // If form already has a pre-filled address (from saved account), forward-geocode it
    const province = (this.group.get('province')?.value ?? '') as string;
    const district = (this.group.get('district')?.value ?? '') as string;
    const ward     = (this.group.get('ward')?.value    ?? '') as string;

    if (province) {
      const displayText = [ward, district, province].filter(Boolean).join(', ');
      this.resolvedAddress.set(displayText);
      // Try to center map on saved address
      this.addrSvc.geocode(displayText).subscribe(coords => {
        if (coords) {
          this.map.setView([coords.lat, coords.lng], 14);
          this.placeMarker(coords.lat, coords.lng);
        }
      });
      return; // Don't auto-locate if there's already a saved address
    }

    // No saved address → try to auto-locate
    this.tryAutoLocate();
  }

  private tryAutoLocate() {
    if (!navigator.geolocation) return;
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      pos => this.setPin(pos.coords.latitude, pos.coords.longitude),
      () => this.locating.set(false),
      { timeout: 8000, enableHighAccuracy: false }
    );
  }

  locateMe() {
    if (!navigator.geolocation) {
      this.geoError.set('Trình duyệt không hỗ trợ định vị');
      return;
    }
    this.locating.set(true);
    this.geoError.set('');
    navigator.geolocation.getCurrentPosition(
      pos => this.setPin(pos.coords.latitude, pos.coords.longitude),
      err => {
        this.locating.set(false);
        this.geoError.set(
          err.code === 1 ? 'Bạn đã từ chối chia sẻ vị trí' :
          err.code === 2 ? 'Không xác định được vị trí' :
                           'Hết thời gian lấy vị trí'
        );
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  }

  private setPin(lat: number, lng: number) {
    this.locating.set(true);
    this.map.setView([lat, lng], 16);
    this.placeMarker(lat, lng);
    this.reverseAndFill(lat, lng);
  }

  private placeMarker(lat: number, lng: number) {
    const L = this.L;
    const icon = L.divIcon({
      className: '',
      html: `
        <div style="
          width:28px; height:28px;
          background:#5a8a5e;
          border:3px solid #fff;
          border-radius:50%;
          box-shadow:0 2px 8px rgba(0,0,0,.35);
          position:relative;
        ">
          <div style="
            position:absolute; bottom:-10px; left:50%;
            transform:translateX(-50%);
            width:0; height:0;
            border-left:6px solid transparent;
            border-right:6px solid transparent;
            border-top:10px solid #5a8a5e;
          "></div>
        </div>
      `,
      iconSize: [28, 38],
      iconAnchor: [14, 38],
      popupAnchor: [0, -40],
    });

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { draggable: true, icon })
        .addTo(this.map)
        .on('dragend', (e: any) => {
          const ll = e.target.getLatLng();
          this.locating.set(true);
          this.reverseAndFill(ll.lat, ll.lng);
        });
    }
    this.hasPinned.set(true);
  }

  private reverseAndFill(lat: number, lng: number) {
    this.addrSvc.reverseGeocode(lat, lng).subscribe(loc => {
      this.locating.set(false);

      const p = this.addrSvc.findProvince(loc.province);
      const province = p?.name ?? loc.province ?? '';
      const district = loc.district ?? '';
      const ward     = loc.ward     ?? '';

      this.setCtrl('province', province);
      this.setCtrl('district', district);
      this.setCtrl('ward',     ward);

      const display = [ward, district, province].filter(Boolean).join(', ');
      this.resolvedAddress.set(display || 'Xác định được vị trí nhưng không có địa chỉ');
      if (display) this.geoError.set('');
    });
  }

  private setCtrl(name: string, value: string) {
    const ctrl = this.group.get(name);
    if (ctrl) { ctrl.setValue(value); ctrl.markAsDirty(); }
  }

  ngOnDestroy() {
    this.map?.remove();
  }
}
