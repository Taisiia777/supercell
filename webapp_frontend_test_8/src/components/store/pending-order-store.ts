import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Типы для состояния заказа
type OrderStatus = 'PENDING' | 'PAID' | 'DELIVERED' | 'CANCELLED';

interface PendingOrder {
  createdAt: number;
  orderId?: string;
  paymentUrl?: string;
  items: any[]; // Уточните типизацию items
  totalPrice: number;
  status?: OrderStatus;
  // Новое поле для отслеживания перенаправлений
  redirected?: {
    success?: boolean;
    review?: boolean;
  };
}

interface PendingOrderState {
  pendingOrder: PendingOrder | null;
  setPendingOrder: (order: PendingOrder) => void;
  clearPendingOrder: () => void;
  isPendingOrderExpired: () => boolean;
  getRemainingTime: () => number;
  setPaymentInfo: (orderId: string, paymentUrl: string) => void;
  
  // Новый метод для получения статуса заказа
  getOrderStatus: () => OrderStatus;
  
  // Новый метод для обновления статуса заказа
  updateOrderStatus: (status: OrderStatus) => void;
  markRedirected: (type: 'success' | 'review') => void;

}

const ORDER_EXPIRY_TIME = 15 * 60 * 1000; // 15 минут
export const usePendingOrder = create<PendingOrderState>()(
  persist(
    (set, get) => ({
      pendingOrder: null,
      
      setPendingOrder: (order) => {

        set({ 
          pendingOrder: {
            ...order,
            redirected: {
              success: false,
              review: false
            }
          } 
        });
      },
      
      clearPendingOrder: () => {

        set({ pendingOrder: null });
      },
      
      markRedirected: (type) => {
        const { pendingOrder } = get();


        if (pendingOrder) {
          const newRedirected = {
            ...pendingOrder.redirected,
            [type]: true
          };



          set({
            pendingOrder: {
              ...pendingOrder,
              redirected: newRedirected
            }
          });
        }
      },

      isPendingOrderExpired: () => {
        const { pendingOrder } = get();
        if (!pendingOrder) return true;
        
        const now = Date.now();
        const isExpired = now - pendingOrder.createdAt > ORDER_EXPIRY_TIME;
        
        
        return isExpired;
      },
      
      getRemainingTime: () => {
        const { pendingOrder, isPendingOrderExpired } = get();
        if (!pendingOrder || isPendingOrderExpired()) return 0;
        
        const elapsedTime = Date.now() - pendingOrder.createdAt;
        const remainingTime = Math.max(0, ORDER_EXPIRY_TIME - elapsedTime);
        
        
        return remainingTime;
      },
      
      setPaymentInfo: (orderId, paymentUrl) => {
        const { pendingOrder } = get();

        if (pendingOrder) {
          set({
            pendingOrder: {
              ...pendingOrder,
              orderId,
              paymentUrl
            }
          });
        }
      },
      
      getOrderStatus: () => {
        const { pendingOrder } = get();
        
        const status = !pendingOrder ? 'CANCELLED' : (pendingOrder.status || 'PENDING');
        
        
        return status;
      },
      
      updateOrderStatus: (status) => {
        const { pendingOrder } = get();

        if (pendingOrder) {
          set({
            pendingOrder: {
              ...pendingOrder,
              status
            }
          });
        }
      }
    }),
    {
      name: 'pending-order-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
