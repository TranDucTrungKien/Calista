import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  inject,
  signal,
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
  template: `
    <ng-container [formGroup]="group">
      <!-- Province -->
      <div>
        <label class="label">Tỉnh / Thành phố <span class="text-error">*</span></label>
        <select formControlName="province" class="input" (change)="onProvinceChange($event)">
          <option value="">-- Chọn tỉnh / thành phố --</option>
          @for (p of provinces(); track p.code) {
            <option [value]="p.name">{{ p.name }}</option>
          }
        </select>
      </div>

      <!-- District -->
      <div>
        <label class="label">Quận / Huyện</label>
        <select formControlName="district" class="input" (change)="onDistrictChange($event)"
          [disabled]="districts().length === 0">
          <option value="">
            {{ loadingDistricts() ? 'Đang tải...' : (districts().length ? '-- Chọn quận / huyện --' : '-- Chọn tỉnh trước --') }}
          </option>
          @for (d of districts(); track d.code) {
            <option [value]="d.name">{{ d.name }}</option>
          }
        </select>
      </div>

      <!-- Ward -->
      <div>
        <label class="label">Phường / Xã</label>
        <select formControlName="ward" class="input"
          [disabled]="wards().length === 0">
          <option value="">
            {{ loadingWards() ? 'Đang tải...' : (wards().length ? '-- Chọn phường / xã --' : '-- Chọn quận trước --') }}
          </option>
          @for (w of wards(); track w.code) {
            <option [value]="w.name">{{ w.name }}</option>
          }
        </select>
      </div>
    </ng-container>
  `,
})
export class AddressFieldsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) group!: FormGroup;

  private addr = inject(VietnamAddressService);

  provinces = signal<VnProvince[]>([]);
  districts = signal<VnDistrict[]>([]);
  wards = signal<VnWard[]>([]);
  loadingDistricts = signal(false);
  loadingWards = signal(false);

  private subs: Subscription[] = [];

  ngOnInit() {
    this.addr.getProvinces().subscribe((data) => {
      this.provinces.set(data);
      // If form already has a province selected, load its districts
      const existingProvince = this.group.get('province')?.value;
      if (existingProvince) {
        this.loadDistrictsByName(existingProvince, () => {
          const existingDistrict = this.group.get('district')?.value;
          if (existingDistrict) {
            this.loadWardsByName(existingDistrict);
          }
        });
      }
    });

    // Province changes → load districts
    const provinceSub = this.group.get('province')!.valueChanges.subscribe(
      (name: string) => {
        this.districts.set([]);
        this.wards.set([]);
        this.group.patchValue({ district: '', ward: '' }, { emitEvent: false });
        if (name) {
          this.loadDistrictsByName(name);
        }
      }
    );
    this.subs.push(provinceSub);

    // District changes → load wards
    const districtSub = this.group.get('district')!.valueChanges.subscribe(
      (name: string) => {
        this.wards.set([]);
        this.group.patchValue({ ward: '' }, { emitEvent: false });
        if (name) {
          this.loadWardsByName(name);
        }
      }
    );
    this.subs.push(districtSub);
  }

  onProvinceChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.group.get('province')?.setValue(value);
  }

  onDistrictChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.group.get('district')?.setValue(value);
  }

  private loadDistrictsByName(provinceName: string, callback?: () => void) {
    const p = this.provinces().find((x) => x.name === provinceName);
    if (!p) return;
    this.loadingDistricts.set(true);
    this.addr.getDistricts(p.code).subscribe((data) => {
      this.districts.set(data.districts || []);
      this.loadingDistricts.set(false);
      callback?.();
    });
  }

  private loadWardsByName(districtName: string) {
    const d = this.districts().find((x) => x.name === districtName);
    if (!d) return;
    this.loadingWards.set(true);
    this.addr.getWards(d.code).subscribe((data) => {
      this.wards.set(data.wards || []);
      this.loadingWards.set(false);
    });
  }

  ngOnDestroy() {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
