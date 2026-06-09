import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { MobileNavComponent } from '../mobile-nav/mobile-nav.component';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, MobileNavComponent],
  template: `
    <app-navbar />
    <main class="min-h-[60vh] pb-xxxl md:pb-0">
      <router-outlet />
    </main>
    <app-footer />
    <app-mobile-nav />
  `,
})
export class LayoutComponent implements OnInit {
  private cart = inject(CartService);
  private auth = inject(AuthService);

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.cart.load();
    }
  }
}
