import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ShopeeAccount,
  ShopeeTokenHealth,
  ShopeePagedProducts,
  ShopeePagedOrders,
  ShopeeOrder,
  ShopeePagedLogs,
} from '../models/shopee.models';

@Injectable({ providedIn: 'root' })
export class ShopeeAdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/shopee`;

  initiateOAuth(): Observable<{ authUrl: string }> {
    return this.http.post<{ authUrl: string }>(`${this.base}/oauth/initiate`, {});
  }

  disconnect(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/oauth/disconnect`);
  }

  getStatus(): Observable<ShopeeAccount & { isConnected: boolean }> {
    return this.http.get<ShopeeAccount & { isConnected: boolean }>(`${this.base}/oauth/status`);
  }

  getTokenHealth(): Observable<ShopeeTokenHealth> {
    return this.http.get<ShopeeTokenHealth>(`${this.base}/token-health`);
  }

  listProducts(page = 1, limit = 20, status?: string): Observable<ShopeePagedProducts> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (status) params = params.set('status', status);
    return this.http.get<ShopeePagedProducts>(`${this.base}/products`, { params });
  }

  listOrders(opts: { page?: number; limit?: number; status?: string; startDate?: string; endDate?: string } = {}): Observable<ShopeePagedOrders> {
    let params = new HttpParams().set('page', opts.page ?? 1).set('limit', opts.limit ?? 20);
    if (opts.status) params = params.set('status', opts.status);
    if (opts.startDate) params = params.set('startDate', opts.startDate);
    if (opts.endDate) params = params.set('endDate', opts.endDate);
    return this.http.get<ShopeePagedOrders>(`${this.base}/orders`, { params });
  }

  getOrderDetail(orderSn: string): Observable<{ order: ShopeeOrder }> {
    return this.http.get<{ order: ShopeeOrder }>(`${this.base}/orders/${orderSn}`);
  }

  syncProducts(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/sync/products`, {});
  }

  syncOrders(startDate?: string, endDate?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/sync/orders`, { startDate, endDate });
  }

  updateInventory(shopeeItemId: number, quantity: number, modelId?: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/inventory`, { shopeeItemId, modelId, quantity });
  }

  getSyncLogs(opts: { page?: number; limit?: number; operation?: string; status?: string } = {}): Observable<ShopeePagedLogs> {
    let params = new HttpParams().set('page', opts.page ?? 1).set('limit', opts.limit ?? 20);
    if (opts.operation) params = params.set('operation', opts.operation);
    if (opts.status) params = params.set('status', opts.status);
    return this.http.get<ShopeePagedLogs>(`${this.base}/logs`, { params });
  }
}
