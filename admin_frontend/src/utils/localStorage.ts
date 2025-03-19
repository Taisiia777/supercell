// localStorage utility functions for tracking order and item changes

// Key constants
const CHANGED_ORDERS_KEY = 'changed_orders';
const LAST_VIEWED_PRODUCT_KEY = 'last_viewed_product';
const LAST_VIEWED_ORDER_KEY = 'last_viewed_order';

/**
 * Saves an order ID to the list of orders with changes
 */
export const saveChangedOrderId = (orderId: number): void => {
  try {
      // Получить текущие измененные заказы
      const changedOrdersStr = localStorage.getItem(CHANGED_ORDERS_KEY);
      const changedOrders: number[] = changedOrdersStr 
          ? JSON.parse(changedOrdersStr) 
          : [];
          
      // Добавить ID заказа, если его еще нет
      if (!changedOrders.includes(orderId)) {
          changedOrders.push(orderId);
          localStorage.setItem(CHANGED_ORDERS_KEY, JSON.stringify(changedOrders));
          
          // Создать пользовательское событие для оповещения компонентов
          const event = new CustomEvent('storage-changed');
          window.dispatchEvent(event);
      }
  } catch (error) {
      console.error('Error saving changed order to localStorage:', error);
  }
};

/**
 * Checks if an order has changes
 */
export const hasOrderChanged = (orderId: number): boolean => {
  try {
    const changedOrdersStr = localStorage.getItem(CHANGED_ORDERS_KEY);
    if (!changedOrdersStr) return false;
    
    const changedOrders: number[] = JSON.parse(changedOrdersStr);
    return changedOrders.includes(orderId);
  } catch (error) {
    console.error('Error checking changed order in localStorage:', error);
    return false;
  }
};

/**
 * Removes an order ID from the list of changed orders
 */
export const clearChangedOrderId = (orderId: number): void => {
  try {
    const changedOrdersStr = localStorage.getItem(CHANGED_ORDERS_KEY);
    if (!changedOrdersStr) return;
    
    const changedOrders: number[] = JSON.parse(changedOrdersStr);
    const updatedOrders = changedOrders.filter(id => id !== orderId);
    
    localStorage.setItem(CHANGED_ORDERS_KEY, JSON.stringify(updatedOrders));
  } catch (error) {
    console.error('Error clearing changed order from localStorage:', error);
  }
};

/**
 * Gets all changed order IDs
 */
export const getAllChangedOrderIds = (): number[] => {
  try {
    const changedOrdersStr = localStorage.getItem(CHANGED_ORDERS_KEY);
    return changedOrdersStr ? JSON.parse(changedOrdersStr) : [];
  } catch (error) {
    console.error('Error getting all changed orders from localStorage:', error);
    return [];
  }
};

/**
 * Save the last viewed item ID
 * @param type - 'product' or 'order'
 * @param id - The ID of the item last viewed
 */
export const saveLastViewedItem = (type: 'product' | 'order', id: number): void => {
  try {
    const key = type === 'product' ? LAST_VIEWED_PRODUCT_KEY : LAST_VIEWED_ORDER_KEY;
    localStorage.setItem(key, id.toString());
  } catch (error) {
    console.error(`Error saving last viewed ${type} to localStorage:`, error);
  }
};

/**
 * Get the last viewed item ID
 * @param type - 'product' or 'order'
 * @returns The ID of the last viewed item or null if not found
 */
export const getLastViewedItem = (type: 'product' | 'order'): number | null => {
  try {
    const key = type === 'product' ? LAST_VIEWED_PRODUCT_KEY : LAST_VIEWED_ORDER_KEY;
    const id = localStorage.getItem(key);
    return id ? parseInt(id, 10) : null;
  } catch (error) {
    console.error(`Error getting last viewed ${type} from localStorage:`, error);
    return null;
  }
};

/**
 * Clear the last viewed item
 * @param type - 'product' or 'order'
 */
export const clearLastViewedItem = (type: 'product' | 'order'): void => {
  try {
    const key = type === 'product' ? LAST_VIEWED_PRODUCT_KEY : LAST_VIEWED_ORDER_KEY;
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error clearing last viewed ${type} from localStorage:`, error);
  }
};

// Утилита для работы с локальным хранилищем
// Создайте файл utils/localStorage.ts

// Ключ для хранения ID заказов
const PROCESSED_ORDERS_KEY = 'processed_orders_ids';

// Получить все известные ID заказов
export const getProcessedOrderIds = (): number[] => {
  const storedIds = localStorage.getItem(PROCESSED_ORDERS_KEY);
  return storedIds ? JSON.parse(storedIds) : [];
};

// Сохранить ID заказа в localStorage
export const saveProcessedOrderId = (orderId: number): void => {
  const existingIds = getProcessedOrderIds();
  if (!existingIds.includes(orderId)) {
    existingIds.push(orderId);
    localStorage.setItem(PROCESSED_ORDERS_KEY, JSON.stringify(existingIds));
    
    // Создаем событие для обновления в других вкладках
    const event = new Event('storage-changed');
    window.dispatchEvent(event);
  }
};

// Сохранить массив ID заказов
export const saveProcessedOrderIds = (orderIds: number[]): void => {
  const existingIds = getProcessedOrderIds();
  let changed = false;
  
  orderIds.forEach(id => {
    if (!existingIds.includes(id)) {
      existingIds.push(id);
      changed = true;
    }
  });
  
  if (changed) {
    localStorage.setItem(PROCESSED_ORDERS_KEY, JSON.stringify(existingIds));
    
    // Создаем событие для обновления в других вкладках
    const event = new Event('storage-changed');
    window.dispatchEvent(event);
  }
};

// Проверить, является ли заказ новым
export const isNewOrder = (orderId: number): boolean => {
  return !getProcessedOrderIds().includes(orderId);
};

// Найти новые заказы из списка
export const findNewOrders = (orders: any[]): any[] => {
  const processedIds = getProcessedOrderIds();
  return orders.filter(order => !processedIds.includes(order.id));
};

const ORDER_STATUS_KEY = 'order_statuses';

// Сохранить статус заказа
export const saveOrderStatus = (orderId: number, status: string): void => {
  try {
    const statusesStr = localStorage.getItem(ORDER_STATUS_KEY);
    const statuses = statusesStr ? JSON.parse(statusesStr) : {};
    
    // Сохраняем только если статус изменился
    if (statuses[orderId] !== status) {
      statuses[orderId] = status;
      localStorage.setItem(ORDER_STATUS_KEY, JSON.stringify(statuses));
    }
  } catch (error) {
    console.error('Error saving order status:', error);
  }
};

// Получить предыдущий статус заказа
export const getOrderStatus = (orderId: number): string | null => {
  try {
    const statusesStr = localStorage.getItem(ORDER_STATUS_KEY);
    if (!statusesStr) return null;
    
    const statuses = JSON.parse(statusesStr);
    return statuses[orderId] || null;
  } catch (error) {
    console.error('Error getting order status:', error);
    return null;
  }
};

// Проверить, изменился ли статус на PAID
export const hasStatusChangedToPaid = (orderId: number, currentStatus: string): boolean => {
  const previousStatus = getOrderStatus(orderId);
  return previousStatus !== null && 
         previousStatus !== 'PAID' && 
         currentStatus === 'PAID';
};

const LOGIN_DATA_KEY = 'login_data_state';

// Сохранить состояние login_data
export const saveLoginDataState = (orderId: number, lineId: number, state: boolean): void => {
  try {
    const dataStr = localStorage.getItem(LOGIN_DATA_KEY);
    const data = dataStr ? JSON.parse(dataStr) : {};
    
    if (!data[orderId]) {
      data[orderId] = {};
    }
    
    data[orderId][lineId] = state;
    localStorage.setItem(LOGIN_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving login data state:', error);
  }
};

// Проверить, изменилось ли состояние login_data
export const hasLoginDataChanged = (orderId: number, lineId: number, currentState: boolean): boolean => {
  try {
    const dataStr = localStorage.getItem(LOGIN_DATA_KEY);
    if (!dataStr) return true; // Если нет данных, считаем что изменилось
    
    const data = JSON.parse(dataStr);
    return !data[orderId] || 
           data[orderId][lineId] === undefined || 
           data[orderId][lineId] !== currentState;
  } catch (error) {
    console.error('Error checking login data state:', error);
    return false;
  }
};