// // src/app/hapticFeedback.ts
// 'use client';

// // Функция для вызова вибрации
// export function triggerHapticFeedback(type = 'medium') {
//   const tg = (window as any).Telegram?.WebApp;
  
//   if (tg && tg.HapticFeedback) {
//     tg.HapticFeedback.impactOccurred(type);
//   }
// }

'use client';

/**
 * Функция для вызова вибрации
 * @param type Тип вибрации: 'light', 'medium', 'heavy', 'rigid', 'soft'
 */
export function triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') {
  const tg = (window as any).Telegram?.WebApp;
  
  if (tg && tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred(type);
  }
}

/**
 * Функция для вызова вибрации обратной связи при нажатии
 */
export function notificationOccurred(type: 'error' | 'success' | 'warning' = 'success') {
  const tg = (window as any).Telegram?.WebApp;
  
  if (tg && tg.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred(type);
  }
}

/**
 * Функция для вызова вибрации выбора
 */
export function selectionChanged() {
  const tg = (window as any).Telegram?.WebApp;
  
  if (tg && tg.HapticFeedback) {
    tg.HapticFeedback.selectionChanged();
  }
}