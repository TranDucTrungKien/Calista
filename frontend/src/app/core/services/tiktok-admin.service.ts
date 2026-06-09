import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TikTokAccount,
  TikTokTokenHealth,
  TikTokPagedProducts,
  TikTokPagedOrders,
  TikTokOrder,
  TikTokPagedLogs,
} from '../models/tiktok.models';

@Injectable({ providedIn: 'root' })
export class TikTokAdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/tiktok`;

  // ── OAuth ──────────────────────────────────────────────────

  /** Returns the TikTok OAuth URL. Frontend redirects to it. */
  initiateOAuth(): Observable<{ authUrl: string }> {
    return this.http.post<{ authUrl: string }>(`${this.base}/oauth/initiate`, {});
  }

  /** Disconnects the connected TikTok Shop. */
  disconnect(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/oauth/disconnect`);
  }

  /** Returns current connection status and token expiry info. */
  getStatus(): Observable<TikTokAccount & { isConnected: boolean }> {
    return this.http.get<TikTokAccount & { isConnected: boolean }>(`${this.base}/oauth/status`);
  }

  // ── Token Health ───────────────────────────────────────────

  getTokenHealth(): Observable<TikTokTokenHealth> {
    return this.http.get<TikTokTokenHealth>(`${this.base}/token-health`);
  }

  // ── Seller ─────────────────────────────────────────────────

  getSeller(): Observable<{ seller: unknown }> {
    return this.http.get<{ seller: unknown }>(`${this.base}/seller`);
  }

  // ── Products ───────────────────────────────────────────────

  listProducts(page = 1, limit = 20, status?: string): Observable<TikTokPagedProducts> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (status) params = params.set('status', status);
    return this.http.get<TikTokPagedProducts>(`${this.base}/products`, { params });
  }

  // ── Orders ─────────────────────────────────────────────────

  listOrders(opts: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Observable<TikTokPagedOrders> {
    let params = new HttpParams()
      .set('page', opts.page ?? 1)
      .set('limit', opts.limit ?? 20);
    if (opts.status) params = params.set('status', opts.status);
    if (opts.startDate) params = params.set('startDate', opts.startDate);
    if (opts.endDate) params = params.set('endDate', opts.endDate);
    return this.http.get<TikTokPagedOrders>(`${this.base}/orders`, { params });
  }

  getOrderDetail(orderId: string): Observable<{ order: TikTokOrder }> {
    return this.http.get<{ order: TikTokOrder }>(`${this.base}/orders/${orderId}`);
  }

  getShipping(orderId: string): Observable<{ shipping: unknown }> {
    return this.http.get<{ shipping: unknown }>(`${this.base}/orders/${orderId}/shipping`);
  }

  // ── Sync ───────────────────────────────────────────────────

  syncProducts(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/sync/products`, {});
  }

  syncOrders(startDate?: string, endDate?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/sync/orders`, {
      startDate,
      endDate,
    });
  }

  updateInventory(
    tiktokProductId: string,
    skuId: string,
    quantity: number
  ): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/inventory`, {
      tiktokProductId,
      skuId,
      quantity,
    });
  }

  // ── Logs ───────────────────────────────────────────────────

  getSyncLogs(opts: {
    page?: number;
    limit?: number;
    operation?: string;
    status?: string;
  } = {}): Observable<TikTokPagedLogs> {
    let params = new HttpParams()
      .set('page', opts.page ?? 1)
      .set('limit', opts.limit ?? 20);
    if (opts.operation) params = params.set('operation', opts.operation);
    if (opts.status) params = params.set('status', opts.status);
    return this.http.get<TikTokPagedLogs>(`${this.base}/logs`, { params });
  }
}
