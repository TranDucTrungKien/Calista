import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UsersService } from '../../core/services/users.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Product } from '../../core/models';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { StarButtonDirective } from '../../shared/directives/star-button.directive';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ProductCardComponent,
    EmptyStateComponent,
    StarButtonDirective,
  ],
  template: `
    <div class="container-app py-lg">
      <h1 class="text-headline-md mb-lg">Sản phẩm yêu thích</h1>
      @if (loading()) {
        <p class="text-body-md text-on-surface-variant">Đang tải...</p>
      } @else if (items().length === 0) {
        <app-empty-state title="Chưa có sản phẩm yêu thích" message="Khám phá và thêm những sản phẩm bạn yêu thích nhất vào đây.">
          <a routerLink="/san-pham" class="btn-primary mt-md" appStarBtn>Khám phá ngay</a>
        </app-empty-state>
      } @else {
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-md">
          @for (p of items(); track p._id) {
            <app-product-card [product]="p" [wishlisted]="true" (wishlistToggle)="onToggle(p)" />
          }
        </div>
      }
    </div>
  `,
})
export class WishlistComponent implements OnInit {
  private users = inject(UsersService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  items = signal<Product[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.users.getWishlist().subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onToggle(p: Product) {
    this.users.toggleWishlist(p._id).subscribe({
      next: (res) => {
        const user = this.auth.user();
        if (user) this.auth.setUser({ ...user, wishlist: res.wishlist });
        this.items.update((arr) => arr.filter((x) => x._id !== p._id));
        this.toast.success('Đã bỏ khỏi yêu thích');
      },
    });
  }
}
