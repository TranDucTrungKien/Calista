import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductsService } from '../../core/services/products.service';
import { Product } from '../../core/models';
import { VndPipe } from '../../shared/pipes/vnd.pipe';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, RouterLink, VndPipe],
  template: `
    <h1 class="text-headline-md mb-lg">Quản lý sản phẩm</h1>
    <div class="card p-md">
      <table class="w-full text-body-sm">
        <thead>
          <tr class="border-b border-outline-variant text-on-surface-variant">
            <th class="text-left py-sm">Sản phẩm</th>
            <th class="text-left py-sm">Tồn kho</th>
            <th class="text-right py-sm">Giá</th>
            <th class="text-right py-sm"></th>
          </tr>
        </thead>
        <tbody>
          @for (p of products(); track p._id) {
            <tr class="border-b border-outline-variant">
              <td class="py-sm flex items-center gap-sm">
                <img [src]="p.images[0]" alt="" class="w-[40px] h-[40px] rounded-md object-cover" />
                <span class="font-semibold">{{ p.name }}</span>
              </td>
              <td class="py-sm" [class.text-error]="p.stock < 10">{{ p.stock }}</td>
              <td class="py-sm text-right">{{ p.price | vnd }}</td>
              <td class="py-sm text-right">
                <a [routerLink]="['/san-pham', p.slug]" class="text-primary hover:underline">Xem</a>
              </td>
            </tr>
          }
        </tbody>
      </table>
      <p class="text-body-sm text-on-surface-variant mt-md">
        Tính năng thêm/sửa/xóa sản phẩm với upload Cloudinary sẽ được hoàn thiện ở giai đoạn polish.
      </p>
    </div>
  `,
})
export class AdminProductsComponent implements OnInit {
  private products$ = inject(ProductsService);
  products = signal<Product[]>([]);

  ngOnInit() {
    this.products$.list({ limit: 60 }).subscribe({ next: (r) => this.products.set(r.items) });
  }
}
