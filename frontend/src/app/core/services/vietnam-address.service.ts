import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

export interface VnProvince {
  code: number;
  name: string;
  division_type: string;
  districts?: VnDistrict[];
}

export interface VnDistrict {
  code: number;
  name: string;
  division_type: string;
  wards?: VnWard[];
}

export interface VnWard {
  code: number;
  name: string;
  division_type: string;
}

const BASE = 'https://provinces.open-api.vn/api/v1';

@Injectable({ providedIn: 'root' })
export class VietnamAddressService {
  private http = inject(HttpClient);

  // Cache the provinces list — it never changes
  private provinces$: Observable<VnProvince[]> | null = null;

  getProvinces(): Observable<VnProvince[]> {
    if (!this.provinces$) {
      this.provinces$ = this.http
        .get<VnProvince[]>(`${BASE}/p/`)
        .pipe(shareReplay(1));
    }
    return this.provinces$;
  }

  getDistricts(provinceCode: number): Observable<VnProvince> {
    return this.http.get<VnProvince>(`${BASE}/p/${provinceCode}?depth=2`);
  }

  getWards(districtCode: number): Observable<VnDistrict> {
    return this.http.get<VnDistrict>(`${BASE}/d/${districtCode}?depth=2`);
  }
}
