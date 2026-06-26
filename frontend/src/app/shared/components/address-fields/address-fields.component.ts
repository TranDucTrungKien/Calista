import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  VietnamAddressService,
  VnDistrict,
  VnProvince,
  VnWard,
} from '../../../core/services/vietnam-address.service';

@Component({
  selector: 'app-address-fields',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [`
    .addr-dropdown {
      position: absolute;
      top: calc(100% + 2px);
      left: 0; right: 0;
      z-index: 200;
      background: var(--color-surface, #fff);
      border: 1px solid var(--color-outline-variant, #ddd);
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,.10);
      max-height: 220px;
      overflow-y: auto;
    }
    .addr-option {
      display: block;
      width: 100%;
      text-align: left;
      padding: 8px 14px;
      font-size: 14px;
      background: transparent;
      border: none;
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .addr-option:hover, .addr-option.active {
      background: var(--color-surface-mid, #f5f5f5);
    }
    .addr-empty {
      padding: 10px 14px;
      font-size: 13px;
      color: var(--color-on-surface-variant, #777);
    }
  `],
  template: `
    <!-- Province autocomplete -->
    <div class="relative">
      <label class="label">Tỉnh / Thành phố <span class="text-error">*</span></label>
      <input
        type="text"
        class="input"
        placeholder="Gõ để tìm tỉnh / thành phố..."
        autocomplete="off"
        [value]="provinceText()"
        (input)="onProvinceInput($event)"
        (focus)="provinceOpen.set(true)"
        (blur)="scheduleClose(provinceOpen)"
      />
      @if (provinceOpen() && provinces().length > 0) {
        <div class="addr-dropdown">
          @if (filteredProvinces().length === 0) {
            <p class="addr-empty">Không tìm thấy kết quả</p>
          } @else {
            @for (p of filteredProvinces(); track p.code) {
              <button type="button" class="addr-option"
                [class.active]="group.get('province')?.value === p.name"
                (mousedown)="selectProvince(p)">
                {{ p.name }}
              </button>
            }
          }
        </div>
      }
    </div>

    <!-- District autocomplete -->
    <div class="relative">
      <label class="label">Quận / Huyện</label>
      <input
        type="text"
        class="input"
        [placeholder]="districts().length ? 'Gõ để tìm quận / huyện...' : (loadingDistricts() ? 'Đang tải...' : 'Chọn tỉnh / thành phố trước')"
        autocomplete="off"
        [disabled]="!districts().length && !loadingDistricts()"
        [value]="districtText()"
        (input)="onDistrictInput($event)"
        (focus)="districtOpen.set(true)"
        (blur)="scheduleClose(districtOpen)"
      />
      @if (districtOpen() && filteredDistricts().length > 0) {
        <div class="addr-dropdown">
          @for (d of filteredDistricts(); track d.code) {
            <button type="button" class="addr-option"
              [class.active]="group.get('district')?.value === d.name"
              (mousedown)="selectDistrict(d)">
              {{ d.name }}
            </button>
          }
        </div>
      }
    </div>

    <!-- Ward autocomplete -->
    <div class="relative">
      <label class="label">Phường / Xã</label>
      <input
        type="text"
        class="input"
        [placeholder]="wards().length ? 'Gõ để tìm phường / xã...' : (loadingWards() ? 'Đang tải...' : 'Chọn quận / huyện trước')"
        autocomplete="off"
        [disabled]="!wards().length && !loadingWards()"
        [value]="wardText()"
        (input)="onWardInput($event)"
        (focus)="wardOpen.set(true)"
        (blur)="scheduleClose(wardOpen)"
      />
      @if (wardOpen() && filteredWards().length > 0) {
        <div class="addr-dropdown">
          @for (w of filteredWards(); track w.code) {
            <button type="button" class="addr-option"
              [class.active]="group.get('ward')?.value === w.name"
              (mousedown)="selectWard(w)">
              {{ w.name }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class AddressFieldsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) group!: FormGroup;

  private addr = inject(VietnamAddressService);

  provinces = signal<VnProvince[]>([]);
  districts = signal<VnDistrict[]>([]);
  wards = signal<VnWard[]>([]);

  provinceText = signal('');
  districtText = signal('');
  wardText = signal('');

  provinceOpen = signal(false);
  districtOpen = signal(false);
  wardOpen = signal(false);

  loadingDistricts = signal(false);
  loadingWards = signal(false);

  // Filter lists based on what's typed
  filteredProvinces = computed(() => {
    const q = this.provinceText().toLowerCase();
    return q
      ? this.provinces().filter((p) => p.name.toLowerCase().includes(q))
      : this.provinces();
  });

  filteredDistricts = computed(() => {
    const q = this.districtText().toLowerCase();
    return q
      ? this.districts().filter((d) => d.name.toLowerCase().includes(q))
      : this.districts();
  });

  filteredWards = computed(() => {
    const q = this.wardText().toLowerCase();
    return q
      ? this.wards().filter((w) => w.name.toLowerCase().includes(q))
      : this.wards();
  });

  private subs: Subscription[] = [];

  ngOnInit() {
    this.addr.getProvinces().subscribe((data) => {
      this.provinces.set(data);
      // Restore pre-filled values
      const pName = this.group.get('province')?.value as string;
      if (pName) {
        this.provinceText.set(pName);
        this.loadDistrictsByName(pName, () => {
          const dName = this.group.get('district')?.value as string;
          if (dName) {
            this.districtText.set(dName);
            this.loadWardsByName(dName, () => {
              const wName = this.group.get('ward')?.value as string;
              if (wName) this.wardText.set(wName);
            });
          }
        });
      }
    });
  }

  // ── Province ──────────────────────────────────────────────────────────────

  onProvinceInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.provinceText.set(val);
    this.provinceOpen.set(true);
    // Clear the form value when user edits text (must re-select)
    this.group.patchValue({ province: '', district: '', ward: '' }, { emitEvent: false });
    this.districtText.set('');
    this.wardText.set('');
    this.districts.set([]);
    this.wards.set([]);
  }

  selectProvince(p: VnProvince) {
    this.provinceText.set(p.name);
    this.provinceOpen.set(false);
    this.group.patchValue({ province: p.name, district: '', ward: '' }, { emitEvent: false });
    this.districtText.set('');
    this.wardText.set('');
    this.districts.set([]);
    this.wards.set([]);
    this.loadingDistricts.set(true);
    this.addr.getDistricts(p.code).subscribe((data) => {
      this.districts.set(data.districts || []);
      this.loadingDistricts.set(false);
    });
  }

  // ── District ──────────────────────────────────────────────────────────────

  onDistrictInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.districtText.set(val);
    this.districtOpen.set(true);
    this.group.patchValue({ district: '', ward: '' }, { emitEvent: false });
    this.wardText.set('');
    this.wards.set([]);
  }

  selectDistrict(d: VnDistrict) {
    this.districtText.set(d.name);
    this.districtOpen.set(false);
    this.group.patchValue({ district: d.name, ward: '' }, { emitEvent: false });
    this.wardText.set('');
    this.wards.set([]);
    this.loadingWards.set(true);
    this.addr.getWards(d.code).subscribe((data) => {
      this.wards.set(data.wards || []);
      this.loadingWards.set(false);
    });
  }

  // ── Ward ──────────────────────────────────────────────────────────────────

  onWardInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.wardText.set(val);
    this.wardOpen.set(true);
    this.group.patchValue({ ward: '' }, { emitEvent: false });
  }

  selectWard(w: VnWard) {
    this.wardText.set(w.name);
    this.wardOpen.set(false);
    this.group.patchValue({ ward: w.name }, { emitEvent: false });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  // Delay closing so mousedown on option fires before blur closes the list
  scheduleClose(openSignal: ReturnType<typeof signal<boolean>>) {
    setTimeout(() => openSignal.set(false), 150);
  }

  private loadDistrictsByName(name: string, cb?: () => void) {
    const p = this.provinces().find((x) => x.name === name);
    if (!p) return;
    this.loadingDistricts.set(true);
    this.addr.getDistricts(p.code).subscribe((data) => {
      this.districts.set(data.districts || []);
      this.loadingDistricts.set(false);
      cb?.();
    });
  }

  private loadWardsByName(name: string, cb?: () => void) {
    const d = this.districts().find((x) => x.name === name);
    if (!d) return;
    this.loadingWards.set(true);
    this.addr.getWards(d.code).subscribe((data) => {
      this.wards.set(data.wards || []);
      this.loadingWards.set(false);
      cb?.();
    });
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
