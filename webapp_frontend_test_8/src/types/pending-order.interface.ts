// src/types/pending-order.interface.ts
import { IProduct } from './products.interface';
import { CartItem } from './store.interface';

export interface PendingOrderItem extends CartItem {
  productDetails?: Partial<IProduct>;
}

export interface PendingOrder {
  items: PendingOrderItem[];
  email: string;
  createdAt: number; // Unix timestamp
  totalPrice: number;
  paymentUrl?: string; // Добавляем ссылку на оплату
  orderId?: string; // Добавляем ID заказа для проверки статуса
}

export interface PendingOrderState {
  pendingOrder: PendingOrder | null;
  setPendingOrder: (order: PendingOrder) => void;
  clearPendingOrder: () => void;
  isPendingOrderExpired: () => boolean;
  getRemainingTime: () => number;
  setPaymentInfo: (orderId: string, paymentUrl: string) => void; // Добавляем метод для сохранения информации об оплате
}