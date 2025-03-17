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

