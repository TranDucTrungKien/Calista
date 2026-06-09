export interface TikTokAccount {
  _id?: string;
  shopId: string;
  shopName: string;
  appKey?: string;
  isConnected: boolean;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  openId?: string;
  sellerId?: string;
  lastSyncAt: string | null;
  refreshTokenWarning?: boolean;
  createdAt?: string;
}

export interface TikTokTokenHealth {
  isConnected: boolean;
  shopName?: string;
  shopId?: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  refreshTokenWarning?: boolean;
  lastSyncAt?: string | null;
}

export interface TikTokSku {
  skuId: string;
  skuName: string;
  price: number;
  currencyCode: string;
  stock: number;
  sellerSku?: string;
}

export interface TikTokProduct {
  _id: string;
  tiktokProductId: string;
  shopId: string;
  title: string;
  description?: string;
  status: 'ACTIVATE' | 'SOLD_OUT' | 'INACTIVE' | 'DELETED';
  skus: TikTokSku[];
  images: string[];
  categoryId?: string;
  syncedAt: string;
}

export interface TikTokPagedProducts {
  items: TikTokProduct[];
  total: number;
  page: number;
  limit: number;
}

export interface TikTokOrderItem {
  tiktokItemId: string;
  tiktokSkuId: string;
  title: string;
  quantity: number;
  salePrice: number;
}

export interface TikTokAddress {
  name: string;
  phone: string;
  fullAddress: string;
  city: string;
  state?: string;
  zipCode?: string;
  country: string;
}

export type TikTokOrderStatus =
  | 'UNPAID'
  | 'ON_HOLD'
  | 'AWAITING_SHIPMENT'
  | 'AWAITING_COLLECTION'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface TikTokOrder {
  _id: string;
  tiktokOrderId: string;
  shopId: string;
  status: TikTokOrderStatus;
  paymentMethod: string;
  currency: string;
  totalOriginalPrice: number;
  totalSellerDiscount: number;
  totalAmount: number;
  items: TikTokOrderItem[];
  recipientAddress: TikTokAddress;
  trackingNumber?: string;
  shippingProvider?: string;
  tiktokCreatedAt: string;
  syncedAt: string;
}

export interface TikTokPagedOrders {
  items: TikTokOrder[];
  total: number;
  page: number;
  limit: number;
}

export interface TikTokSyncLog {
  _id: string;
  shopId: string;
  operation:
    | 'oauth_connect'
    | 'oauth_disconnect'
    | 'token_refresh'
    | 'sync_products'
    | 'sync_orders'
    | 'sync_inventory'
    | 'webhook_received'
    | 'update_stock'
    | 'sync_seller';
  status: 'success' | 'error' | 'skipped';
  itemsAffected: number;
  errorCode?: string;
  errorMessage?: string;
  durationMs?: number;
  triggeredBy: 'cron' | 'manual' | 'webhook' | 'system';
  createdAt: string;
}

export interface TikTokPagedLogs {
  items: TikTokSyncLog[];
  total: number;
  page: number;
  limit: number;
}
