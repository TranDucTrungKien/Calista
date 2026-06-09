import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Category, Product, Review } from '../models';

export interface ProductQuery {
  category?: string;
  skinType?: string;
  tag?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  sort?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
}

export interface ProductList {
  items: Product[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  list(query: ProductQuery = {}) {
    let params = new HttpParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<ProductList>(`${this.base}/products`, { params });
  }

  detail(slug: string) {
    return this.http.get<{ product: Product; related: Product[] }>(
      `${this.base}/products/${slug}`
    );
  }

  categories() {
    return this.http.get<{ items: Category[] }>(`${this.base}/categories`);
  }

  reviews(productId: string) {
    return this.http.get<{ items: Review[] }>(`${this.base}/reviews/${productId}`);
  }

  postReview(productId: string, body: { rating: number; comment: string; images?: string[] }) {
    return this.http.post<{ review: Review }>(
      `${this.base}/reviews/${productId}`,
      body
    );
  }

  adminCreate(body: Partial<Product>) {
    return this.http.post<{ product: Product }>(`${this.base}/products`, body);
  }
  adminUpdate(id: string, body: Partial<Product>) {
    return this.http.put<{ product: Product }>(
      `${this.base}/products/${id}`,
      body
    );
  }
  adminDelete(id: string) {
    return this.http.delete<{ message: string }>(`${this.base}/products/${id}`);
  }
}
