'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './payment-reminder-banner.module.scss';
import { usePendingOrder } from '@/components/store/pending-order-store';
import {useTelegram} from "@/app/useTg";
export default function PaymentReminderBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const {  webApp } = useTelegram();
  const { pendingOrder, clearPendingOrder, isPendingOrderExpired, getRemainingTime, updateOrderStatus, markRedirected  } = usePendingOrder();
  const [remainingTime, setRemainingTime] = useState(getRemainingTime());
  const [isVisible, setIsVisible] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const isCheckoutPage = pathname?.includes('/checkout') || 
  pathname?.includes('/payment') || 
  pathname?.includes('/order/') || 
  pathname?.includes('/cart') || 
  pathname?.includes('/success') || 
  pathname?.includes('/review');
  // Проверяем наличие платежной ссылки в заказе
  const hasPaymentInfo = pendingOrder?.paymentUrl && pendingOrder?.orderId;


const checkOrderStatus = async () => {
  if (!pendingOrder?.orderId) return;
  
  try {
    const response = await fetch(`${process.env.API_URL}customer/order/${pendingOrder.orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webApp?.initData}`,
      },
      cache: 'no-cache'
    });
    
    if (!response.ok) throw new Error('Не удалось получить статус заказа');
    
    const data = await response.json();
    const newStatus = data.order?.status;
    
    // Проверяем флаг редиректа из localStorage напрямую
    const storageData = JSON.parse(localStorage.getItem('pending-order-storage') || '{}');
    const redirectedSuccess = storageData?.state?.pendingOrder?.redirected?.success || false;
    
    setOrderStatus(newStatus);
    
    switch (newStatus) {
      case 'PAID':
      case 'PROCESSING': // Добавляем обработку PROCESSING аналогично PAID
        if (!redirectedSuccess) {
          updateOrderStatus('PAID');
          markRedirected('success');
          
          // Явно обновляем localStorage, чтобы быть уверенным что изменения сохранились
          localStorage.setItem('pending-order-storage', JSON.stringify({
            state: {
              pendingOrder: {
                ...storageData.state.pendingOrder,
                redirected: {
                  ...storageData.state.pendingOrder.redirected,
                  success: true
                },
                status: 'PAID'
              }
            },
            version: storageData.version
          }));
          
          router.push(`/order/${pendingOrder.orderId}/success`);
        }
        break;
      
      case 'DELIVERED':
        // Аналогичная логика для review
        const redirectedReview = storageData?.state?.pendingOrder?.redirected?.review || false;
        if (!redirectedReview) {
          updateOrderStatus('DELIVERED');
          markRedirected('review');
          
          localStorage.setItem('pending-order-storage', JSON.stringify({
            state: {
              pendingOrder: {
                ...storageData.state.pendingOrder,
                redirected: {
                  ...storageData.state.pendingOrder.redirected,
                  review: true
                },
                status: 'DELIVERED'
              }
            },
            version: storageData.version
          }));
          
          router.push(`/order/${pendingOrder.orderId}/review`);
        }
        break;
    }
  } catch (error) {
    console.error('Ошибка при проверке статуса заказа:', error);
  }
};
  useEffect(() => {
    // Универсальная проверка статуса независимо от текущей страницы
    if (pendingOrder?.orderId) {
      checkOrderStatus();
      
      // Периодическая проверка статуса каждые 30 секунд
      const statusIntervalId = setInterval(checkOrderStatus, 3000);
      
      return () => clearInterval(statusIntervalId);
    }
  }, [pendingOrder?.orderId]);

  useEffect(() => {
    if (isCheckoutPage) {
      setIsVisible(false);
      return;
    }
    
    // Проверяем флаг редиректа из localStorage напрямую
    const storageData = JSON.parse(localStorage.getItem('pending-order-storage') || '{}');
    const redirectedSuccess = storageData?.state?.pendingOrder?.redirected?.success || false;
    const currentStatus = storageData?.state?.pendingOrder?.status;
    
    // Если заказ оплачен или уже был редирект, скрываем баннер
    if (currentStatus === 'PAID' || currentStatus === 'PROCESSING' || redirectedSuccess) {
      setIsVisible(false);
      return;
    }
    
    // Проверяем, есть ли незавершенный заказ с платежной информацией и не истек ли его срок
    if (hasPaymentInfo && !isPendingOrderExpired()) {
      setIsVisible(true);
      
      // Обновляем оставшееся время каждую секунду
      const timerIntervalId = setInterval(() => {
        const newRemainingTime = getRemainingTime();
        setRemainingTime(newRemainingTime);
        
        // Если время истекло, скрываем плашку и обновляем статус
        if (newRemainingTime <= 0) {
          setIsVisible(false);
          // Вместо полного удаления, обновляем статус
          updateOrderStatus('CANCELLED');
          clearInterval(timerIntervalId);
        }
      }, 1000);
      
      return () => {
        clearInterval(timerIntervalId);
      };
    } else if (pendingOrder && isPendingOrderExpired()) {
      // Если заказ есть, но его срок истек, обновляем статус
      updateOrderStatus('CANCELLED');
      setIsVisible(false);
    }
  }, [pendingOrder, hasPaymentInfo, updateOrderStatus, isPendingOrderExpired, getRemainingTime, isCheckoutPage, orderStatus]);
  // useEffect(() => {
  //   if (isCheckoutPage) {
  //     setIsVisible(false);
  //     return;
  //   }
    
  //   // Проверяем, есть ли незавершенный заказ с платежной информацией и не истек ли его срок
  //   if (hasPaymentInfo && !isPendingOrderExpired()) {
  //     setIsVisible(true);
      
  //     // Обновляем оставшееся время каждую секунду
  //     const timerIntervalId = setInterval(() => {
  //       const newRemainingTime = getRemainingTime();
  //       setRemainingTime(newRemainingTime);
        
  //       // Если время истекло, скрываем плашку и обновляем статус
  //       if (newRemainingTime <= 0) {
  //         setIsVisible(false);
  //         // Вместо полного удаления, обновляем статус
  //         updateOrderStatus('CANCELLED');
  //         clearInterval(timerIntervalId);
  //       }
  //     }, 1000);
      
  //     return () => {
  //       clearInterval(timerIntervalId);
  //     };
  //   } else if (pendingOrder && isPendingOrderExpired()) {
  //     // Если заказ есть, но его срок истек, обновляем статус
  //     updateOrderStatus('CANCELLED');
  //   }
  // }, [pendingOrder, hasPaymentInfo, updateOrderStatus, isPendingOrderExpired, getRemainingTime, isCheckoutPage]);

  if (!isVisible || !hasPaymentInfo || isCheckoutPage) {
    return null;
  }

  // Форматируем оставшееся время в минуты и секунды
  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);
  
  // Вычисляем прогресс для progress bar (от 100% до 0%)
  const progressPercentage = (remainingTime / (15 * 60 * 1000)) * 100;

 
  const handleContinuePayment = () => {
    // Открываем ссылку на оплату в новой вкладке
    if (pendingOrder?.paymentUrl) {
      window.open(pendingOrder.paymentUrl, '_blank', 'noopener,noreferrer');
    }
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
            Ожидает оплаты
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
              <div className={styles.orderNumber}>Заказ #{pendingOrder.orderId}</div>
              <div className={styles.price}>{pendingOrder.totalPrice} ₽</div>
            </div>
            <div className={styles.products}>
              Ссылка на оплату действительна в течение {minutes} мин {seconds} сек
            </div>
          </div>
        </div>
        
        <div className={styles.action}>
          <button className={styles.button} onClick={handleDismiss}>
            Отмена
          </button>
          <button className={`${styles.button} ${styles.primary}`} onClick={handleContinuePayment}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.33337 8H12.6667" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 3.33331L12.6667 7.99998L8 12.6666" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Оплатить
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