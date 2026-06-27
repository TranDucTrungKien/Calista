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
import { FormGroup } from '@angular/forms';
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
  imports: [CommonModule],
  styles: [`
    .addr-wrap { position: relative; }
    .addr-dropdown {
      position: absolute;
      top: calc(100% + 2px);
      left: 0; right: 0;
      z-index: 300;
      background: #fff;
      border: 1px solid #d4d4d4;
      border-radius: 8px;
      box-shadow: 0 6px 20px rgba(0,0,0,.12);
      max-height: 220px;
      overflow-y: auto;
    }
    .addr-option {
      display: block; width: 100%;
      text-align: left; padding: 8px 14px;
      font-size: 13.5px; line-height: 1.4;
      background: none; border: none; cursor: pointer;
    }
    .addr-option:hover { background: #f5f5f5; }
    .addr-option.selected { background: #eff6ee; font-weight: 600; }
    .addr-empty { padding: 10px 14px; font-size: 13px; color: #888; }
  `],
  template: `
    <div class="grid md:grid-cols-3 gap-md">

      <!-- Province -->
      <div class="addr-wrap">
        <label class="label">Tỉnh / Thành phố <span class="text-error">*</span></label>
        <input #pInput type="text" class="input" autocomplete="off"
          placeholder="Gõ để tìm..."
          [value]="provinceText()"
          (input)="onType('province', $event)"
          (focus)="openProvince()"
          (blur)="onBlur('province')"
        />
        @if (show() === 'province' && filteredProvinces().length) {
          <div class="addr-dropdown">
            @for (p of filteredProvinces(); track p.code) {
              <button type="button" class="addr-option"
                [class.selected]="selectedProvince()?.code === p.code"
                (mousedown)="pick('province', p)">{{ p.name }}</button>
            }
          </div>
        }
        @if (show() === 'province' && provinceText() && !filteredProvinces().length) {
          <div class="addr-dropdown"><p class="addr-empty">Không tìm thấy</p></div>
        }
      </div>

      <!-- District -->
      <div class="addr-wrap">
        <label class="label">Quận / Huyện</label>
        <input type="text" class="input" autocomplete="off"
          [placeholder]="loadingD() ? 'Đang tải...' : (districts().length ? 'Gõ để tìm...' : 'Chọn tỉnh trước')"
          [disabled]="!districts().length"
          [value]="districtText()"
          (input)="onType('district', $event)"
          (focus)="show.set('district')"
          (blur)="onBlur('district')"
        />
        @if (show() === 'district' && filteredDistricts().length) {
          <div class="addr-dropdown">
            @for (d of filteredDistricts(); track d.code) {
              <button type="button" class="addr-option"
                [class.selected]="selectedDistrict()?.code === d.code"
                (mousedown)="pick('district', d)">{{ d.name }}</button>
            }
          </div>
        }
      </div>

      <!-- Ward -->
      <div class="addr-wrap">
        <label class="label">Phường / Xã</label>
        <input type="text" class="input" autocomplete="off"
          [placeholder]="loadingW() ? 'Đang tải...' : (wards().length ? 'Gõ để tìm...' : 'Chọn quận trước')"
          [disabled]="!wards().length"
          [value]="wardText()"
          (input)="onType('ward', $event)"
          (focus)="show.set('ward')"
          (blur)="onBlur('ward')"
        />
        @if (show() === 'ward' && filteredWards().length) {
          <div class="addr-dropdown">
            @for (w of filteredWards(); track w.code) {
              <button type="button" class="addr-option"
                [class.selected]="selectedWard()?.code === w.code"
                (mousedown)="pick('ward', w)">{{ w.name }}</button>
            }
          </div>
        }
      </div>

    </div>
  `,
})
export class AddressFieldsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) group!: FormGroup;

  private addr = inject(VietnamAddressService);
  private subs: Subscription[] = [];

  provinces = signal<VnProvince[]>([]);
  districts = signal<VnDistrict[]>([]);
  wards    = signal<VnWard[]>([]);

  selectedProvince = signal<VnProvince | null>(null);
  selectedDistrict = signal<VnDistrict | null>(null);
  selectedWard     = signal<VnWard | null>(null);

  provinceText = signal('');
  districtText = signal('');
  wardText     = signal('');

  /** Which dropdown is currently open: 'province' | 'district' | 'ward' | null */
  show = signal<string | null>(null);

  loadingD = signal(false);
  loadingW = signal(false);

  filteredProvinces = computed(() => {
    const q = this.provinceText().toLowerCase();
    return q ? this.provinces().filter(p => p.name.toLowerCase().includes(q))
              : this.provinces();
  });
  filteredDistricts = computed(() => {
    const q = this.districtText().toLowerCase();
    return q ? this.districts().filter(d => d.name.toLowerCase().includes(q))
              : this.districts();
  });
  filteredWards = computed(() => {
    const q = this.wardText().toLowerCase();
    return q ? this.wards().filter(w => w.name.toLowerCase().includes(q))
              : this.wards();
  });

  ngOnInit() {
    this.addr.getProvinces().subscribe(list => {
      this.provinces.set(list);
      this.restoreFromGroup();
    });
  }

  /** Restore pre-filled form values (e.g. user default address in checkout) */
  private restoreFromGroup() {
    const pName = this.group.get('province')?.value as string;
    if (!pName) return;

    const p = this.provinces().find(x => x.name === pName);
    if (!p) { this.provinceText.set(pName); return; }

    this.selectedProvince.set(p);
    this.provinceText.set(p.name);

    const dName = this.group.get('district')?.value as string;
    this.loadingD.set(true);
    this.addr.getDistricts(p.code).subscribe(data => {
      this.districts.set(data.districts || []);
      this.loadingD.set(false);

      if (dName) {
        const d = this.districts().find(x => x.name === dName);
        if (d) {
          this.selectedDistrict.set(d);
          this.districtText.set(d.name);

          const wName = this.group.get('ward')?.value as string;
          this.loadingW.set(true);
          this.addr.getWards(d.code).subscribe(w => {
            this.wards.set(w.wards || []);
            this.loadingW.set(false);
            const ward = this.wards().find(x => x.name === wName);
            if (ward) { this.selectedWard.set(ward); this.wardText.set(ward.name); }
          });
        }
      }
    });
  }

  // ── Typing ───────────────────────────────────────────────────────────────

  onType(field: 'province' | 'district' | 'ward', e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.show.set(field);

    if (field === 'province') {
      this.provinceText.set(val);
      // Clear selection if user edits text
      this.selectedProvince.set(null);
      this.selectedDistrict.set(null);
      this.selectedWard.set(null);
      this.districtText.set(''); this.wardText.set('');
      this.districts.set([]); this.wards.set([]);
      this.setCtrl('province', ''); this.setCtrl('district', ''); this.setCtrl('ward', '');
    } else if (field === 'district') {
      this.districtText.set(val);
      this.selectedDistrict.set(null);
      this.selectedWard.set(null);
      this.wardText.set(''); this.wards.set([]);
      this.setCtrl('district', ''); this.setCtrl('ward', '');
    } else {
      this.wardText.set(val);
      this.selectedWard.set(null);
      this.setCtrl('ward', '');
    }
  }

  openProvince() {
    this.show.set('province');
  }

  onBlur(_field: string) {
    // Delay so mousedown on option fires first
    setTimeout(() => this.show.set(null), 180);
  }

  // ── Selection ─────────────────────────────────────────────────────────────

  pick(field: 'province' | 'district' | 'ward', item: VnProvince | VnDistrict | VnWard) {
    this.show.set(null);

    if (field === 'province') {
      const p = item as VnProvince;
      this.selectedProvince.set(p);
      this.provinceText.set(p.name);
      this.setCtrl('province', p.name);

      // Reset downstream
      this.selectedDistrict.set(null); this.selectedWard.set(null);
      this.districtText.set(''); this.wardText.set('');
      this.districts.set([]); this.wards.set([]);
      this.setCtrl('district', ''); this.setCtrl('ward', '');

      // Load districts
      this.loadingD.set(true);
      this.addr.getDistricts(p.code).subscribe(data => {
        this.districts.set(data.districts || []);
        this.loadingD.set(false);
      });

    } else if (field === 'district') {
      const d = item as VnDistrict;
      this.selectedDistrict.set(d);
      this.districtText.set(d.name);
      this.setCtrl('district', d.name);

      this.selectedWard.set(null);
      this.wardText.set(''); this.wards.set([]);
      this.setCtrl('ward', '');

      this.loadingW.set(true);
      this.addr.getWards(d.code).subscribe(data => {
        this.wards.set(data.wards || []);
        this.loadingW.set(false);
      });

    } else {
      const w = item as VnWard;
      this.selectedWard.set(w);
      this.wardText.set(w.name);
      this.setCtrl('ward', w.name);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private setCtrl(name: string, value: string) {
    const ctrl = this.group.get(name);
    if (ctrl) {
      ctrl.setValue(value);
      ctrl.markAsDirty();
    }
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe());
  }
}
