import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface VnProvince {
  code: number;       // first old code, used as unique ID
  name: string;
  oldCodes: number[]; // all old province codes to fetch districts from
  oldNames?: string[];// old province names that merged into this one
}

export interface VnDistrict {
  code: number;
  name: string;
  wards?: VnWard[];
}

export interface VnWard {
  code: number;
  name: string;
}

export interface GeoAddress {
  province: string;
  district: string;
  ward: string;
}

// 34 tỉnh/thành phố từ 01/07/2025 (Nghị quyết 12/6/2025)
// oldCodes: mã tỉnh cũ (63 tỉnh) để gọi API quận/huyện
const PROVINCES: VnProvince[] = [
  // ── 2 thành phố trực thuộc TW không thay đổi ────────────────────────
  { code: 1,  name: 'Thành phố Hà Nội',          oldCodes: [1] },
  { code: 46, name: 'Thành phố Huế',              oldCodes: [46] },
  // ── 9 tỉnh không thay đổi ───────────────────────────────────────────
  { code: 4,  name: 'Tỉnh Cao Bằng',              oldCodes: [4] },
  { code: 11, name: 'Tỉnh Điện Biên',             oldCodes: [11] },
  { code: 42, name: 'Tỉnh Hà Tĩnh',              oldCodes: [42] },
  { code: 12, name: 'Tỉnh Lai Châu',              oldCodes: [12] },
  { code: 20, name: 'Tỉnh Lạng Sơn',             oldCodes: [20] },
  { code: 40, name: 'Tỉnh Nghệ An',              oldCodes: [40] },
  { code: 22, name: 'Tỉnh Quảng Ninh',           oldCodes: [22] },
  { code: 38, name: 'Tỉnh Thanh Hóa',            oldCodes: [38] },
  { code: 14, name: 'Tỉnh Sơn La',               oldCodes: [14] },
  // ── 4 thành phố mới (có sáp nhập) ───────────────────────────────────
  { code: 31, name: 'Thành phố Hải Phòng',        oldCodes: [31, 30],     oldNames: ['Hải Dương', 'Tỉnh Hải Dương'] },
  { code: 48, name: 'Thành phố Đà Nẵng',          oldCodes: [48, 49],     oldNames: ['Quảng Nam', 'Tỉnh Quảng Nam'] },
  { code: 79, name: 'Thành phố Hồ Chí Minh',      oldCodes: [79, 77, 74], oldNames: ['Bà Rịa - Vũng Tàu', 'Tỉnh Bà Rịa - Vũng Tàu', 'Bình Dương', 'Tỉnh Bình Dương'] },
  { code: 92, name: 'Thành phố Cần Thơ',          oldCodes: [92, 94, 93], oldNames: ['Sóc Trăng', 'Tỉnh Sóc Trăng', 'Hậu Giang', 'Tỉnh Hậu Giang'] },
  // ── 19 tỉnh mới (có sáp nhập) ───────────────────────────────────────
  { code: 10, name: 'Tỉnh Lào Cai',              oldCodes: [10, 15],     oldNames: ['Yên Bái', 'Tỉnh Yên Bái'] },
  { code: 8,  name: 'Tỉnh Tuyên Quang',           oldCodes: [8, 2],       oldNames: ['Hà Giang', 'Tỉnh Hà Giang'] },
  { code: 19, name: 'Tỉnh Thái Nguyên',           oldCodes: [19, 6],      oldNames: ['Bắc Kạn', 'Tỉnh Bắc Kạn'] },
  { code: 25, name: 'Tỉnh Phú Thọ',              oldCodes: [25, 26, 17], oldNames: ['Vĩnh Phúc', 'Tỉnh Vĩnh Phúc', 'Hòa Bình', 'Hoà Bình', 'Tỉnh Hoà Bình'] },
  { code: 27, name: 'Tỉnh Bắc Ninh',             oldCodes: [27, 24],     oldNames: ['Bắc Giang', 'Tỉnh Bắc Giang'] },
  { code: 33, name: 'Tỉnh Hưng Yên',             oldCodes: [33, 34],     oldNames: ['Thái Bình', 'Tỉnh Thái Bình'] },
  { code: 37, name: 'Tỉnh Ninh Bình',            oldCodes: [37, 35, 36], oldNames: ['Hà Nam', 'Tỉnh Hà Nam', 'Nam Định', 'Tỉnh Nam Định'] },
  { code: 45, name: 'Tỉnh Quảng Trị',            oldCodes: [45, 44],     oldNames: ['Quảng Bình', 'Tỉnh Quảng Bình'] },
  { code: 51, name: 'Tỉnh Quảng Ngãi',           oldCodes: [51, 62],     oldNames: ['Kon Tum', 'Tỉnh Kon Tum'] },
  { code: 64, name: 'Tỉnh Gia Lai',              oldCodes: [64, 52],     oldNames: ['Bình Định', 'Tỉnh Bình Định'] },
  { code: 56, name: 'Tỉnh Khánh Hòa',            oldCodes: [56, 58],     oldNames: ['Ninh Thuận', 'Tỉnh Ninh Thuận'] },
  { code: 68, name: 'Tỉnh Lâm Đồng',             oldCodes: [68, 67, 60], oldNames: ['Đắk Nông', 'Tỉnh Đắk Nông', 'Bình Thuận', 'Tỉnh Bình Thuận'] },
  { code: 66, name: 'Tỉnh Đắk Lắk',             oldCodes: [66, 54],     oldNames: ['Phú Yên', 'Tỉnh Phú Yên'] },
  { code: 75, name: 'Tỉnh Đồng Nai',             oldCodes: [75, 70],     oldNames: ['Bình Phước', 'Tỉnh Bình Phước'] },
  { code: 72, name: 'Tỉnh Tây Ninh',             oldCodes: [72, 80],     oldNames: ['Long An', 'Tỉnh Long An'] },
  { code: 86, name: 'Tỉnh Vĩnh Long',            oldCodes: [86, 83, 84], oldNames: ['Bến Tre', 'Tỉnh Bến Tre', 'Trà Vinh', 'Tỉnh Trà Vinh'] },
  { code: 87, name: 'Tỉnh Đồng Tháp',            oldCodes: [87, 82],     oldNames: ['Tiền Giang', 'Tỉnh Tiền Giang'] },
  { code: 96, name: 'Tỉnh Cà Mau',               oldCodes: [96, 95],     oldNames: ['Bạc Liêu', 'Tỉnh Bạc Liêu'] },
  { code: 89, name: 'Tỉnh An Giang',             oldCodes: [89, 91],     oldNames: ['Kiên Giang', 'Tỉnh Kiên Giang'] },
];

// Lookup map: normalized name → province (includes old names for backward compat)
function normProvince(s: string): string {
  return s.toLowerCase().replace(/^(tỉnh|thành phố|tp\.?)\s+/i, '').trim();
}

const PROVINCE_MAP = new Map<string, VnProvince>();
PROVINCES.forEach(p => {
  PROVINCE_MAP.set(normProvince(p.name), p);
  p.oldNames?.forEach(n => PROVINCE_MAP.set(normProvince(n), p));
});

const BASE = 'https://provinces.open-api.vn/api/v1';

@Injectable({ providedIn: 'root' })
export class VietnamAddressService {
  private http = inject(HttpClient);

  getProvinces(): Observable<VnProvince[]> {
    return of(PROVINCES);
  }

  /** Find province by any name (new or old), returns null if not found */
  findProvince(name: string): VnProvince | null {
    return PROVINCE_MAP.get(normProvince(name)) ?? null;
  }

  /** Fetch districts for a province — handles merged provinces (multiple old codes) */
  getDistricts(province: VnProvince): Observable<VnDistrict[]> {
    if (!province.oldCodes.length) return of([]);
    const calls = province.oldCodes.map(code =>
      this.http.get<{ districts?: VnDistrict[] }>(`${BASE}/p/${code}?depth=2`).pipe(
        map(p => p.districts ?? []),
        catchError(() => of([] as VnDistrict[]))
      )
    );
    return forkJoin(calls).pipe(
      map(results => results.flat().sort((a, b) => a.name.localeCompare(b.name, 'vi')))
    );
  }

  /** Fetch wards for a district */
  getWards(districtCode: number): Observable<VnWard[]> {
    return this.http.get<{ wards?: VnWard[] }>(`${BASE}/d/${districtCode}?depth=2`).pipe(
      map(d => d.wards ?? []),
      catchError(() => of([] as VnWard[]))
    );
  }

  /** Reverse geocode via Nominatim (OpenStreetMap, free, no key) */
  reverseGeocode(lat: number, lng: number): Observable<GeoAddress> {
    return this.http.get<any>('https://nominatim.openstreetmap.org/reverse', {
      params: { format: 'jsonv2', lat: String(lat), lon: String(lng), 'accept-language': 'vi' },
    }).pipe(
      map(res => {
        const a = res.address ?? {};
        return {
          province: a.state ?? a.city ?? '',
          district: a.city_district ?? a.county ?? a.municipality ?? a.town ?? '',
          ward: a.suburb ?? a.neighbourhood ?? a.quarter ?? a.village ?? '',
        };
      }),
      catchError(() => of({ province: '', district: '', ward: '' } as GeoAddress))
    );
  }

  /** Forward geocode: address string → lat/lng (for centering map on saved address) */
  geocode(query: string): Observable<{ lat: number; lng: number } | null> {
    return this.http.get<any[]>('https://nominatim.openstreetmap.org/search', {
      params: { format: 'json', q: query, countrycodes: 'vn', limit: '1', 'accept-language': 'vi' },
    }).pipe(
      map(r => r.length ? { lat: +r[0].lat, lng: +r[0].lon } : null),
      catchError(() => of(null))
    );
  }
}
