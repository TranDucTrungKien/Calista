export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'customer' | 'admin';
  avatar?: string;
  addresses?: Address[];
  wishlist?: string[];
}

export interface Address {
  _id?: string;
  fullName: string;
  phone: string;
  line1: string;
  ward?: string;
  district?: string;
  province: string;
  isDefault?: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  description?: string;
  ingredients?: string;
  howToUse?: string;
  images: string[];
  category: Category | string;
  skinTypes: string[];
  tags: string[];
  stock: number;
  ratings: { avg: number; count: number };
  isFeatured?: boolean;
}

export interface CartItem {
  _id: string;
  productId: string;
  qty: number;
  price: number;
  snapshot: { name: string; image: string; slug: string };
}

export interface Cart {
  _id?: string;
  userId?: string;
  items: CartItem[];
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  qty: number;
  price: number;
}

export type OrderStatus =
  | 'Chờ xác nhận'
  | 'Đã xác nhận'
  | 'Đang giao'
  | 'Đã giao'
  | 'Đã hủy';

export type PaymentMethod = 'cod' | 'momo' | 'zalopay';

export interface Order {
  _id: string;
  code: string;
  items: OrderItem[];
  shippingAddress: Omit<Address, '_id' | 'isDefault'>;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  orderStatus: OrderStatus;
  statusHistory: { status: string; at: string; note?: string }[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  trackingNumber?: string;
  note?: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  userId: { _id: string; name: string; avatar?: string } | string;
  productId: string;
  rating: number;
  comment: string;
  images: string[];
  createdAt: string;
}
