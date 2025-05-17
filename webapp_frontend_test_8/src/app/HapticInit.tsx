// // src/app/HapticInit.tsx
// 'use client';

// import { useEffect } from 'react';

// export default function HapticInit() {
//   useEffect(() => {
//     // Код для инициализации вибрации
//     const addHapticFeedback = () => {
//       const tg = (window as any).Telegram?.WebApp;
      
//       if (!tg || !tg.HapticFeedback) return;
      
//       // Добавляем обработчики для кнопок
//       document.querySelectorAll('button, .btn, [role="button"]').forEach(button => {
//         button.addEventListener('click', () => {
//           tg.HapticFeedback.impactOccurred('medium');
//         });
//       });
//     };
    
//     // Запускаем через небольшую задержку, чтобы дать время загрузке WebApp
//     setTimeout(addHapticFeedback, 500);
//   }, []);
  
//   return null; // Этот компонент не рендерит ничего видимого
// }


'use client';

import { useEffect } from 'react';

export default function HapticInit() {
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    
    if (!tg || !tg.HapticFeedback) return;
    
    // Используем делегирование событий на уровне документа
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Проверяем, является ли элемент или его ближайший родитель кликабельным
      if (
        target?.tagName === 'BUTTON' || 
        target?.closest('button') || 
        target?.closest('.btn') || 
        target?.closest('[role="button"]') ||
        target?.closest('a') ||
        target?.getAttribute('role') === 'button' ||
        target?.classList.contains('btn')
      ) {
        // Вызываем вибрацию средней интенсивности
        tg.HapticFeedback.impactOccurred('medium');
      }
    };

    // Добавляем один слушатель на весь документ
    document.addEventListener('click', handleClick);

    // Удаляем слушатель при размонтировании компонента
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return null; // Этот компонент не рендерит ничего видимого
}