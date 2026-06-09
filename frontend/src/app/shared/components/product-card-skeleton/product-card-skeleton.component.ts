import { Component } from '@angular/core';

@Component({
  selector: 'app-product-card-skeleton',
  standalone: true,
  template: `
    <div class="rounded-[14px] overflow-hidden bg-surface border border-outline-variant">
      <div class="skeleton aspect-[4/5] rounded-none"></div>
      <div class="pt-sm px-xs pb-xs space-y-sm">
        <div class="skeleton h-[12px] w-[35%]"></div>
        <div class="skeleton h-[18px] w-[75%]"></div>
        <div class="skeleton h-[18px] w-[55%] mt-xs"></div>
      </div>
    </div>
  `,
})
export class ProductCardSkeletonComponent {}
