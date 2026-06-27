import { Injectable, computed, effect, signal } from '@angular/core';
import { Cart, CartItem, Product } from '../models';

const LOCAL_KEY = 'calista.cart';

@Injectable({ providedIn: 'root' })
export class CartService {
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
      localStorage.setItem(LOCAL_KEY, JSON.stringify(this._cart()));
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

  load() {}

  mergeOnLogin() {}

  add(product: Product, qty = 1) {
    const cart = { ...this._cart(), items: [...this._cart().items] };
    const idx = cart.items.findIndex((i) => i.productId === product._id);
    if (idx >= 0) {
      cart.items[idx] = { ...cart.items[idx], qty: cart.items[idx].qty + qty };
    } else {
      cart.items.push({
        _id: `local-${product._id}`,
        productId: product._id,
        variantId: product.variantId || '',
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
    const cart = { ...this._cart() };
    cart.items = cart.items.map((i) =>
      i._id === item._id ? { ...i, qty } : i
    );
    this._cart.set(cart);
  }

  remove(item: CartItem) {
    const cart = { ...this._cart() };
    cart.items = cart.items.filter((i) => i._id !== item._id);
    this._cart.set(cart);
  }

  clear() {
    this._cart.set({ items: [] });
  }
}
