import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Address, Order, OrderStatus, PaymentMethod } from '../models';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  create(body: {
    shippingAddress: Omit<Address, '_id' | 'isDefault'>;
    paymentMethod: PaymentMethod;
    note?: string;
  }) {
    return this.http.post<{
      order: Order;
      payment: { provider: string; payUrl: string | null };
    }>(`${this.base}/orders`, body);
  }

  listMine() {
    return this.http.get<{ items: Order[] }>(`${this.base}/orders`);
  }

  detail(id: string) {
    return this.http.get<{ order: Order }>(`${this.base}/orders/${id}`);
  }

  cancel(id: string) {
    return this.http.put<{ order: Order }>(
      `${this.base}/orders/${id}/cancel`,
      {}
    );
  }

  adminList(status?: OrderStatus) {
    const params: Record<string, string> = {};
    if (status) params['status'] = status;
    return this.http.get<{ items: Order[]; total: number }>(
      `${this.base}/orders/admin`,
      { params }
    );
  }

  adminUpdateStatus(id: string, status: OrderStatus, note?: string) {
    return this.http.put<{ order: Order }>(
      `${this.base}/orders/${id}/status`,
      { status, note }
    );
  }
}
