import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Address, Product, User } from '../models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  me() {
    return this.http.get<{ user: User }>(`${this.base}/users/me`);
  }

  update(body: Partial<Pick<User, 'name' | 'phone' | 'avatar'>>) {
    return this.http.put<{ user: User }>(`${this.base}/users/me`, body);
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.put<{ message: string }>(`${this.base}/users/me/password`, {
      currentPassword,
      newPassword,
    });
  }

  addAddress(addr: Omit<Address, '_id'>) {
    return this.http.post<{ addresses: Address[] }>(
      `${this.base}/users/me/addresses`,
      addr
    );
  }
  updateAddress(id: string, addr: Omit<Address, '_id'>) {
    return this.http.put<{ addresses: Address[] }>(
      `${this.base}/users/me/addresses/${id}`,
      addr
    );
  }
  removeAddress(id: string) {
    return this.http.delete<{ addresses: Address[] }>(
      `${this.base}/users/me/addresses/${id}`
    );
  }

  getWishlist() {
    return this.http.get<{ items: Product[] }>(`${this.base}/users/me/wishlist`);
  }
  toggleWishlist(productId: string) {
    return this.http.post<{ wishlist: string[]; added: boolean }>(
      `${this.base}/users/me/wishlist`,
      { productId }
    );
  }

  adminList() {
    return this.http.get<{ items: User[] }>(`${this.base}/users`);
  }
}
