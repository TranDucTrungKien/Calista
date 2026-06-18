export interface ShopeeAccount {
  _id?: string;
  shopId: number;
  shopName: string;
  region: string;
  isConnected: boolean;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  lastSyncAt: string | null;
  refreshTokenWarning?: boolean;
}

export interface ShopeeTokenHealth {
  isConnected: boolean;
  shopId?: number;
  shopName?: string;
  region?: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  refreshTokenWarning?: boolean;
  lastSyncAt?: string | null;
}

export interface ShopeeProduct {
  _id: string;
  shopeeItemId: number;
  shopId: number;
  name: string;
  description?: string;
  status: 'NORMAL' | 'DELETED' | 'BANNED' | 'UNLIST';
  price: number;
  currency: string;
  stock: number;
  images: string[];
  categoryId?: number;
  syncedAt: string;
}

export interface ShopeePagedProducts {
  items: ShopeeProduct[];
  total: number;
  page: number;
  limit: number;
}

export interface ShopeeOrderItem {
  shopeeItemId: number;
  variationId?: number;
  name: string;
  quantity: number;
  price: number;
}

export type ShopeeOrderStatus =
  | 'UNPAID' | 'READY_TO_SHIP' | 'RETRY_SHIP' | 'SHIPPED'
  | 'TO_CONFIRM_RECEIVE' | 'IN_CANCEL' | 'CANCELLED' | 'COMPLETED';

export interface ShopeeOrder {
  _id: string;
  shopeeOrderSn: string;
  shopId: number;
  buyerUsername: string;
  orderStatus: ShopeeOrderStatus;
  paymentMethod: string;
  currency: string;
  totalAmount: number;
  items: ShopeeOrderItem[];
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  shopeeCreateTime: string;
  syncedAt: string;
}

export interface ShopeePagedOrders {
  items: ShopeeOrder[];
  total: number;
  page: number;
  limit: number;
}

export interface ShopeeSyncLog {
  _id: string;
  shopId: number;
  operation: string;
  status: 'success' | 'error' | 'skipped';
  itemsAffected: number;
  errorCode?: string;
  errorMessage?: string;
  durationMs?: number;
  triggeredBy: string;
  createdAt: string;
}

export interface ShopeePagedLogs {
  items: ShopeeSyncLog[];
  total: number;
  page: number;
  limit: number;
}
