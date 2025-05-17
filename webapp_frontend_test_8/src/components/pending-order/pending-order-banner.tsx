'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Добавляем usePathname
import Image from 'next/image';
import styles from './pending-order-banner.module.scss';
import { usePendingOrder } from '@/components/store/pending-order-store';

export default function PendingOrderBanner() {
  const router = useRouter();
  const pathname = usePathname(); // Получаем текущий путь
  const { pendingOrder, clearPendingOrder, isPendingOrderExpired, getRemainingTime } = usePendingOrder();
  const [remainingTime, setRemainingTime] = useState(getRemainingTime());
  const [isVisible, setIsVisible] = useState(false);
  const isCheckoutPage = pathname?.includes('/checkout') || pathname?.includes('/payment') || pathname?.includes('/order/') || pathname?.includes('/cart');

  // useEffect(() => {
  //   if (isCheckoutPage) {
  //     setIsVisible(false);
  //     return;
  //   }
  //   // Проверяем, есть ли незавершенный заказ и не истек ли его срок
  //   if (pendingOrder && !isPendingOrderExpired()) {
  //     setIsVisible(true);
      
  //     // Обновляем оставшееся время каждую секунду
  //     const intervalId = setInterval(() => {
  //       const newRemainingTime = getRemainingTime();
  //       setRemainingTime(newRemainingTime);
        
  //       // Если время истекло, скрываем плашку и очищаем заказ
  //       if (newRemainingTime <= 0) {
  //         setIsVisible(false);
  //         clearPendingOrder();
  //         clearInterval(intervalId);
  //       }
  //     }, 1000);
      
  //     return () => clearInterval(intervalId);
  //   } else if (pendingOrder && isPendingOrderExpired()) {
  //     // Если заказ есть, но его срок истек, очищаем его
  //     clearPendingOrder();
  //   }
  // }, [pendingOrder, clearPendingOrder, isPendingOrderExpired, isCheckoutPage]);
  useEffect(() => {
    if (isCheckoutPage) {
      setIsVisible(false);
      return;
    }
  
    // Проверяем LocalStorage для определения статуса и флага редиректа
    const storageData = JSON.parse(localStorage.getItem('pending-order-storage') || '{}');
    const redirectedSuccess = storageData?.state?.pendingOrder?.redirected?.success || false;
    const currentStatus = storageData?.state?.pendingOrder?.status;
  
    // Если заказ оплачен или был успешный редирект, скрываем баннер
    if (currentStatus === 'PAID' || currentStatus === 'PROCESSING' || redirectedSuccess || currentStatus === 'DELIVERED') {
      setIsVisible(false);
      return;
    }
    
    // Проверяем, есть ли незавершенный заказ и не истек ли его срок
    if (pendingOrder && !isPendingOrderExpired()) {
      setIsVisible(true);
      
      // Обновляем оставшееся время каждую секунду
      const intervalId = setInterval(() => {
        const newRemainingTime = getRemainingTime();
        setRemainingTime(newRemainingTime);
        
        // Если время истекло, скрываем плашку и очищаем заказ
        if (newRemainingTime <= 0) {
          setIsVisible(false);
          clearPendingOrder();
          clearInterval(intervalId);
        }
      }, 1000);
      
      return () => clearInterval(intervalId);
    } else if (pendingOrder && isPendingOrderExpired()) {
      // Если заказ есть, но его срок истек, очищаем его
      clearPendingOrder();
    }
  }, [pendingOrder, clearPendingOrder, isPendingOrderExpired, isCheckoutPage]);
  
  if (!isVisible || !pendingOrder || isCheckoutPage) {
    return null;
  }


  // Форматируем оставшееся время в минуты и секунды
  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);
  
  // Вычисляем прогресс для progress bar (от 100% до 0%)
  const progressPercentage = (remainingTime / (15 * 60 * 1000)) * 100;
  
  // Получаем количество товаров и общую сумму
  const totalItems = pendingOrder.items.reduce((total, item) => total + item.count, 0);
  
  // Получаем названия первых трех товаров для отображения
  const itemNames = pendingOrder.items
    .map(item => item.productDetails?.title || `Товар #${item.id}`)
    .slice(0, 3);
  
  // Остальные товары отображаем как "+N"
  const remainingItems = pendingOrder.items.length > 3 
    ? pendingOrder.items.length - 3 
    : 0;

  const handleContinue = () => {
    router.push('/checkout');
  };

  const handleDismiss = () => {
    setIsVisible(false);
    clearPendingOrder();
  };

  return (
    <div className={styles.bannerContainer}>
      <div className={styles.banner}>
        <div className={styles.header}>
          <div className={styles.title}>
            <span className={styles.icon}>●</span>
            Незавершенный заказ
          </div>
          <div className={styles.timer}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3V8L11 10.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8" cy="8" r="6.5" stroke="currentColor"/>
            </svg>
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </div>
        </div>
        
        <div className={styles.content}>
          <div className={styles.summary}>
            <div className={styles.orderInfo}>
              <div className={styles.count}>{totalItems} {getItemsText(totalItems)}</div>
              <div className={styles.price}>{pendingOrder.totalPrice} ₽</div>
            </div>
            <div className={styles.products}>
              {itemNames.join(', ')}
              {remainingItems > 0 ? ` и еще ${remainingItems}` : ''}
            </div>
          </div>
          
          <div className={styles.thumbnails}>
            {pendingOrder.items.slice(0, 3).map((item, index) => (
              <div key={index} className={styles.thumbnail}>
                {item.productDetails?.images?.[0]?.original ? (
                  <Image 
                    src={item.productDetails.images[0].original} 
                    alt={item.productDetails.title || `Товар #${item.id}`}
                    width={24} 
                    height={24} 
                    style={{ objectFit: 'contain' }} 
                  />
                ) : (
                  <div className={styles.placeholder} />
                )}
              </div>
            ))}
            {remainingItems > 0 && (
              <div className={styles.thumbnail}>
                <span className={styles.more}>+{remainingItems}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.action}>
          <button className={styles.button} onClick={handleDismiss}>
            Отмена
          </button>
          <button className={`${styles.button} ${styles.primary}`} onClick={handleContinue}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.33337 8H12.6667" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 3.33331L12.6667 7.99998L8 12.6666" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Продолжить
          </button>
        </div>
        
        <div 
          className={styles.progressBar} 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}

// Вспомогательная функция для правильного склонения слова "товар"
function getItemsText(count: number): string {
  if (count % 10 === 1 && count % 100 !== 11) {
    return 'товар';
  } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return 'товара';
  } else {
    return 'товаров';
  }
}