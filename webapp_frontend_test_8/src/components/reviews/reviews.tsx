
'use client'
import { useState, useEffect, useRef } from 'react'
import styles from './reviews.module.scss'
import { useTelegram } from '@/app/useTg'
import Image from "next/image";

// Интерфейс для данных отзыва в нашем приложении
interface Review {
  id: number;
  name: string;
  rating: number;
  text: string;
  date: string;
  product?: string;
  price?: string;
  productImage?: string;
  orderId?: number;
  user_avatar?: string;  // Добавьте это поле

}

// Интерфейс для данных отзыва от API
interface ApiReview {
  id: number;
  order: number;
  order_number?: string;
  rating: number;
  comment: string;
  created_dt: string;
  user_name?: string;
  product_name?: string;
  product_price?: string;
  product_image?: string;
  user_avatar?: string; // Добавьте это поле

}

// Интерфейс для ответа API
interface ApiResponse {
  reviews: ApiReview[];
}

// Интерфейс для кэшированных данных
interface CachedReviews {
  data: Review[];
  timestamp: number;
}

// Компонент скелетона для отзывов
const ReviewSkeleton = () => {
  return (
    <div className={styles.reviews}>
      <h2 className={styles.reviews_title}>Отзывы наших клиентов</h2>
      <div className={styles.slider_container}>
        <div className={styles.slider}>
          {[...Array(5)].map((_, index) => (
            <div key={index} className={styles.slide}>
              <div className={`${styles.review_card} ${styles.skeleton_card}`}>
                <div className={styles.review_header}>
                  <div className={styles.avatar_container}>
                    <div className={`${styles.avatar} ${styles.skeleton_element}`}></div>
                  </div>
                  <div className={styles.user_info}>
                    <div className={`${styles.user_name} ${styles.skeleton_element}`}></div>
                    <div className={`${styles.rating} ${styles.skeleton_element}`}></div>
                    <div className={`${styles.date} ${styles.skeleton_element}`}></div>
                  </div>
                </div>
                <div className={`${styles.review_text} ${styles.skeleton_element}`}></div>
                <div className={`${styles.product_info} ${styles.skeleton_element}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.social_links_container}>
        <div className={`${styles.social_item} ${styles.skeleton_element}`}></div>
        <div className={`${styles.social_item} ${styles.skeleton_element}`}></div>
        <div className={`${styles.social_item} ${styles.skeleton_element}`}></div>
      </div>
    </div>
  );
};

const SocialLinks = () => {
  return (
    <div className={styles.social_links_container}>
      <a href="https://www.twitch.tv/mamoyaan" target="_blank" rel="noopener noreferrer" className={styles.social_item}>
        <div className={`${styles.social_icon} ${styles.twitch}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 512 512">
          <rect width="512" height="512" rx="15%" fill="#6441a4"/><path d="m115 101-22 56v228h78v42h44l41-42h63l85-85v-199zm260 185-48 48h-78l-42 42v-42h-65v-204h233zm-48-100v85h-30v-85zm-78 0v85h-29v-85z" fill="#fff"/></svg>
        </div>
        <span className={styles.social_text}>Mamoyan</span>
      </a>
      <a href="https://youtube.com/@mamoyaan?si=5MO6w9aOhFrolTvm" target="_blank" rel="noopener noreferrer" className={styles.social_item}>
        <div className={`${styles.social_icon} ${styles.youtube}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <rect width="40" height="40" rx="6" fill="#FF0000"/>
  <rect x="11" y="13" width="18" height="14" rx="3" fill="white"/>
  <path d="M24 20L18 24V16L24 20Z" fill="#FF0000"/>
</svg>
        </div>
        <span className={styles.social_text}>Mamoyan</span>
      </a>
      <a href="https://t.me/mamochat" target="_blank" rel="noopener noreferrer" className={styles.social_item}>
        <div className={`${styles.social_icon} ${styles.telegram}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="128" fill="#29b6f6"/>
  <path d="M199 404c-11 0-10-4-13-14l-32-105 245-144" fill="#c8daea"/>
  <path d="M199 404c7 0 11-4 16-8l45-43-56-34" fill="#a9c9dd"/>
  <path d="M204 319l135 99c14 9 26 4 30-14l55-258c5-22-9-32-24-25L79 245c-21 8-21 21-4 26l83 26 190-121c9-5 17-3 11 4" fill="#f6fbfe"/>
</svg>
        </div>
        <span className={styles.social_text}>Mamochat</span>
      </a>
    </div>
  );
};

export default function Reviews(): JSX.Element {
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  // Добавляем состояния для отслеживания Y-координат
  const [touchStartY, setTouchStartY] = useState<number | null>(null)
  const [touchEndY, setTouchEndY] = useState<number | null>(null)
  // Добавляем состояние для определения типа свайпа
  const [isHorizontalSwipe, setIsHorizontalSwipe] = useState<boolean>(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  
  const { webApp } = useTelegram()
  const sliderRef = useRef<HTMLDivElement | null>(null)
  
  // Кэширование отзывов
  const CACHE_KEY = 'cached_reviews';
  const CACHE_DURATION = 60 * 60 * 1000; // 1 час в миллисекундах
  
  // Функция для сохранения отзывов в кэш
  const cacheReviews = (reviews: Review[]) => {
    if (typeof window !== 'undefined') {
      const cacheData: CachedReviews = {
        data: reviews,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    }
  };
  
  // Функция для получения отзывов из кэша
  const getCachedReviews = (): Review[] | null => {
    if (typeof window !== 'undefined') {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const parsedData: CachedReviews = JSON.parse(cachedData);
        const now = Date.now();
        // Проверяем, не истек ли срок кэша
        if (now - parsedData.timestamp < CACHE_DURATION) {
          return parsedData.data;
        }
      }
    }
    return null;
  };
  
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Сначала проверяем кэш
        const cachedReviews = getCachedReviews();
        if (cachedReviews && cachedReviews.length > 0) {
          setReviews(cachedReviews);
          setLoading(false);
          
          // Обновляем в фоне, чтобы не блокировать интерфейс
          setTimeout(() => {
            fetchFreshReviews();
          }, 1000);
          
          return;
        }
        
        // Если кэша нет или он устарел, загружаем с API
        await fetchFreshReviews();
      } catch (error) {
        console.error('Ошибка при загрузке отзывов:', error);
        setReviews(reviewsData.slice(0, 5)); // Используем демо-данные при ошибке (только 5)
        setLoading(false);
      }
    };
    
    const fetchFreshReviews = async () => {
      try {
        const response = await fetch(process.env.API_URL + "customer/reviews/", {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': webApp?.initData ? `Bearer ${webApp.initData}` : '',
          },
          cache: "no-cache"
        });
        
        if (response.ok) {
          const data: ApiResponse = await response.json();
          
          if (data && data.reviews && Array.isArray(data.reviews)) {
            // Обработка и форматирование данных
            const formattedReviews = await Promise.all(data.reviews.map(async (review: ApiReview) => {
              // Получаем имя пользователя через ID заказа
              let userName = 'Покупатель';
              // Объявляем orderData на уровне выше
              let orderData = null;
              
              if (review.order) {
                try {
                  const orderResponse = await fetch(process.env.API_URL + `davdamer/order/${review.order}/`, {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': webApp?.initData ? `Bearer ${webApp.initData}` : '',
                    },
                    cache: "no-cache"
                  });
                  
                  if (orderResponse.ok) {
                    orderData = await orderResponse.json(); // Сохраняем в переменную, объявленную выше
                    // Получаем имя пользователя из данных заказа
                    if (orderData && orderData.user) {
                      if (orderData.user.first_name) {
                        userName = orderData.user.first_name;
                        
                        // Добавляем фамилию, если она не пустая
                        if (orderData.user.last_name && orderData.user.last_name.trim() !== "") {
                          userName += ` ${orderData.user.last_name}`;
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.error('Ошибка при получении информации о заказе:', error);
                }
              }
              
              return {
                id: review.id,
                name: userName,
                rating: review.rating,
                text: review.comment,
                date: formatReviewDate(review.created_dt),
                product: review.product_name,
                price: review.product_price,
                productImage: orderData?.lines[0]?.product?.images[0]?.original || null,
                orderId: review.order,
                user_avatar: review.user_avatar // Добавьте эту строку

              };
            }));
            
            // Сортируем отзывы по дате (самые новые сначала) и берем только 5 последних
            const sortedReviews = formattedReviews.sort((a, b) => {
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            }).slice(0, 30);
            
            // Сохраняем отзывы в кэш
            cacheReviews(sortedReviews);
            
            setReviews(sortedReviews);
          } else {
            // Если структура некорректная, используем демо-данные (только 5)
            setReviews(reviewsData.slice(0, 5));
          }
        } else {
          // В случае ошибки используем демо-данные (только 5)
          
          setReviews(reviewsData.slice(0, 5));
        }
      } catch (error) {
        console.error('Ошибка при загрузке свежих отзывов:', error);
        setReviews(reviewsData.slice(0, 5)); // Используем демо-данные при ошибке (только 5)
      } finally {
        setLoading(false);
      }
    };
    
    fetchReviews();
  }, [webApp]);

  // Форматирование даты для отображения
  const formatReviewDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // Если отзыв оставлен сегодня
      if (date.toDateString() === now.toDateString()) {
        return `Сегодня в ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
      
      // Если отзыв оставлен вчера
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return `Вчера в ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      }
      
      // Для более старых дат
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year} в ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    } catch (e) {
      return dateString;
    }
  };
  
  // Примерные данные для отзывов (используются, если API недоступен)
  const reviewsData: Review[] = [
    {
      id: 1,
      name: 'GIO PICA',
      rating: 5,
      text: 'Продавец просто красавчик, всем советую минуты 2 и готово, теперь буду у него брать',
      date: 'Сегодня в 22:33',
      product: 'BRAWL PASS PLUS',
      price: '984 ₽',
      productImage: '/brawlpass.jpg'
    },
    {
      id: 2,
      name: 'monki d luffi',
      rating: 5,
      text: 'Все быстро и очень хороший продавец. Советую',
      date: 'Сегодня в 22:27',
      product: 'BRAWL PASS PLUS',
      price: '984 ₽',
      productImage: '/brawlpass.jpg'
    },
    {
      id: 3,
      name: 'George031214',
      rating: 5,
      text: 'Быстро и четко, респект)',
      date: 'Сегодня в 22:22',
      product: 'BRAWL PASS PLUS',
      price: '984 ₽',
      productImage: '/brawlpass.jpg'
    },
    {
      id: 4,
      name: 'Алексей',
      rating: 5,
      text: 'Отличный магазин! Быстрая доставка, всё работает как надо. Очень доволен покупкой!',
      date: 'Сегодня в 21:45',
      product: 'CLASH ROYALE GEM',
      price: '899 ₽',
      productImage: '/clashroyal.jpg'
    },
    {
      id: 5,
      name: 'Екатерина',
      rating: 5,
      text: 'Всё супер! Купила дочке, она очень довольна. Спасибо за быстрое выполнение заказа!',
      date: 'Сегодня в 21:15',
      product: 'BRAWL STARS GEM',
      price: '799 ₽',
      productImage: '/brawlgem.jpg'
    }
  ]
  
  // Автоматическое переключение слайдов
  useEffect(() => {
    if (!isPaused && reviews.length > 0) {
      const interval = setInterval(() => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % reviews.length)
      }, 5000) // Меняем слайд каждые 5 секунд
      
      return () => clearInterval(interval)
    }
  }, [isPaused, reviews.length])
  
  // Функция для следующего слайда
  const nextSlide = (): void => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % reviews.length)
  }
  
  // Функция для предыдущего слайда
  const prevSlide = (): void => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + reviews.length) % reviews.length)
  }

  // Обработчики свайпов для мобильных устройств
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>): void => {
    setIsPaused(true) // Останавливаем автоматическую прокрутку при касании
    setTouchStart(e.targetTouches[0].clientX)
    setTouchStartY(e.targetTouches[0].clientY) // Сохраняем начальную Y-координату
    setIsHorizontalSwipe(false) // Сбрасываем флаг
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>): void => {
    if (!touchStart || touchStart === null) return
    
    const currentX = e.targetTouches[0].clientX
    const currentY = e.targetTouches[0].clientY
    
    setTouchEnd(currentX)
    setTouchEndY(currentY)
    
    // Определяем, является ли свайп горизонтальным
    const xDiff = Math.abs(touchStart - currentX)
    const yDiff = Math.abs(touchStartY! - currentY)
    
    // Если движение преимущественно горизонтальное и достаточное
    if (xDiff > yDiff && xDiff > 10) {
      setIsHorizontalSwipe(true)
      e.preventDefault() // Предотвращаем стандартное поведение только для горизонтальных свайпов
      
      // Логика визуального эффекта перетаскивания
      if (sliderRef.current) {
        const distance = touchStart - currentX
        const offset = -activeIndex * 100 - (distance / sliderRef.current.offsetWidth * 100)
        
        if ((activeIndex === 0 && distance < 0) || 
            (activeIndex === reviews.length - 1 && distance > 0)) {
          sliderRef.current.querySelector(`.${styles.slider}`)?.setAttribute(
            'style', 
            `transform: translateX(${offset * 0.3}%)`
          )
        } else {
          sliderRef.current.querySelector(`.${styles.slider}`)?.setAttribute(
            'style', 
            `transform: translateX(${offset}%)`
          )
        }
      }
    }
  }

  const handleTouchEnd = (): void => {
    // Обрабатываем только если это был горизонтальный свайп
    if (isHorizontalSwipe && touchStart && touchEnd) {
      const distance = touchStart - touchEnd
      const threshold = 80 // Минимальное расстояние для свайпа
      
      if (distance > threshold && activeIndex < reviews.length - 1) {
        nextSlide()
      } else if (distance < -threshold && activeIndex > 0) {
        prevSlide()
      } else {
        // Возвращаем слайдер в исходное положение
        if (sliderRef.current) {
          sliderRef.current.querySelector(`.${styles.slider}`)?.setAttribute(
            'style', 
            `transform: translateX(-${activeIndex * 100}%)`
          )
        }
      }
    }

    setTouchStart(null)
    setTouchEnd(null)
    setTouchStartY(null)
    setTouchEndY(null)
    setIsHorizontalSwipe(false)
    
    // Восстанавливаем автоматическую прокрутку после завершения свайпа
    setTimeout(() => setIsPaused(false), 1000)
  }
  
  // Показываем скелетон-загрузчик
  if (loading) {
    return <ReviewSkeleton />;
  }
  
  // Если отзывов нет
  if (reviews.length === 0) {
    return <div className={styles.reviews}></div>;
  }
  
  return (
    <div 
      className={styles.reviews}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      // Убираем обработчики touch событий с основного контейнера
    >
      <h2 className={styles.reviews_title}>Отзывы наших клиентов</h2>
      
      <div 
        className={styles.slider_container} 
        ref={sliderRef}
        // Перемещаем обработчики touch событий на контейнер слайдера
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className={styles.slider} 
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {reviews.map((review) => (
            <div key={review.id} className={styles.slide}>
              <div className={styles.review_card}>
                <div className={styles.review_header}>
                  {/* <div className={styles.avatar_container}>
                    <div className={styles.avatar}>
                      {review.name.charAt(0)}
                    </div>
                  </div> */}
                  <div className={styles.avatar_container}>
  {review.user_avatar ? (
    <Image 
      src={review.user_avatar} 
      alt={review.name} 
      width={50} 
      height={50} 
      className={styles.avatar}
      style={{ 
        borderRadius: '50%', 
        objectFit: 'cover' 
      }}
      unoptimized={true}
      loading="lazy"
    />
  ) : (
    <div className={styles.avatar}>
      {review.name.charAt(0)}
    </div>
  )}
</div>
                  <div className={styles.user_info}>
                    <h3 className={styles.user_name}>{review.name}</h3>
                    <div className={styles.rating}>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < review.rating ? styles.star_filled : styles.star}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className={styles.date}>{review.date}</span>
                  </div>
                </div>
                <p className={styles.review_text}>{review.text}</p>
                
                {review.product && (
                  <div className={styles.product_info}>
                    {review.productImage && (
                      <div className={styles.product_image}>
                      <Image 
                        src={review.productImage}
                        alt={review.product || "Товар"}
                        height={100}
                        width={100}
                        style={{ objectFit: 'contain' }}
                        quality={100}
                        unoptimized={true}
                        loading="eager"
                        priority
                      />
                    </div>
                    )}
                    <div className={styles.product_details}>
                      <p className={styles.price}>{review.price}</p>
                      <p className={styles.product_name}>
                        <span className={styles.fire}>🔥</span>
                        {review.product}
                        <span className={styles.fire}>🔥</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Блок социальных сетей */}
      <SocialLinks />
    </div>
  )
}