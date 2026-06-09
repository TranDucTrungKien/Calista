import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Cart, CartItem, Product } from '../models';
import { AuthService } from './auth.service';

const LOCAL_KEY = 'calista.cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private base = environment.apiUrl;

  private _cart = signal<Cart>(this.readLocal());

  cart = this._cart.asReadonly();
  count = computed(() =>
    this._cart().items.reduce((s, i) => s + i.qty, 0)
  );
  subtotal = computed(() =>
    this._cart().items.reduce((s, i) => s + i.qty * i.price, 0)
  );

  constructor() {
    effect(() => {
      const c = this._cart();
      if (!this.auth.isAuthenticated()) {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(c));
      } else {
        localStorage.removeItem(LOCAL_KEY);
      }
    });
  }

  private readLocal(): Cart {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? (JSON.parse(raw) as Cart) : { items: [] };
    } catch {
      return { items: [] };
    }
  }

  load() {
    if (this.auth.isAuthenticated()) {
      this.http.get<{ cart: Cart }>(`${this.base}/cart`).subscribe({
        next: (res) => this._cart.set(res.cart),
        error: () => {},
      });
    }
  }

  mergeOnLogin() {
    const local = this.readLocal();
    if (!local.items.length) {
      this.load();
      return;
    }
    this.http
      .post<{ cart: Cart }>(`${this.base}/cart/merge`, {
        items: local.items.map((i) => ({ productId: i.productId, qty: i.qty })),
      })
      .subscribe({
        next: (res) => {
          this._cart.set(res.cart);
          localStorage.removeItem(LOCAL_KEY);
        },
      });
  }

  add(product: Product, qty = 1) {
    if (this.auth.isAuthenticated()) {
      this.http
        .post<{ cart: Cart }>(`${this.base}/cart`, {
          productId: product._id,
          qty,
        })
        .subscribe({ next: (res) => this._cart.set(res.cart) });
      return;
    }
    const cart = { ...this._cart(), items: [...this._cart().items] };
    const idx = cart.items.findIndex((i) => i.productId === product._id);
    if (idx >= 0) {
      cart.items[idx] = { ...cart.items[idx], qty: cart.items[idx].qty + qty };
    } else {
      cart.items.push({
        _id: `local-${Date.now()}`,
        productId: product._id,
        qty,
        price: product.price,
        snapshot: {
          name: product.name,
          image: product.images[0] || '',
          slug: product.slug,
        },
      });
    }
    this._cart.set(cart);
  }

  updateQty(item: CartItem, qty: number) {
    qty = Math.max(1, qty);
    if (this.auth.isAuthenticated()) {
      this.http
        .put<{ cart: Cart }>(`${this.base}/cart/${item._id}`, { qty })
        .subscribe({ next: (res) => this._cart.set(res.cart) });
      return;
    }
    const cart = { ...this._cart() };
    cart.items = cart.items.map((i) =>
      i._id === item._id ? { ...i, qty } : i
    );
    this._cart.set(cart);
  }

  remove(item: CartItem) {
    if (this.auth.isAuthenticated()) {
      this.http
        .delete<{ cart: Cart }>(`${this.base}/cart/${item._id}`)
        .subscribe({ next: (res) => this._cart.set(res.cart) });
      return;
    }
    const cart = { ...this._cart() };
    cart.items = cart.items.filter((i) => i._id !== item._id);
    this._cart.set(cart);
  }

  clear() {
    if (this.auth.isAuthenticated()) {
      this.http
        .delete<{ cart: Cart }>(`${this.base}/cart`)
        .subscribe({ next: (res) => this._cart.set(res.cart) });
      return;
    }
    this._cart.set({ items: [] });
  }
}
