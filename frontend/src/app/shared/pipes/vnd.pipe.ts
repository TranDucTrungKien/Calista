import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'vnd', standalone: true })
export class VndPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
