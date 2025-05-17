// // ImageCarousel.tsx
// import { FC, TouchEvent, useState } from 'react';
// import Image from 'next/image';
// import styles from './ImageCarousel.module.scss';

// interface ImageCarouselProps {
//   images: {
//     original: string;
//   }[];
//   title: string;
// }

// const ImageCarousel: FC<ImageCarouselProps> = ({ images, title }) => {
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [touchStart, setTouchStart] = useState<number | null>(null);

//   const handleTouchStart = (e: TouchEvent) => {
//     setTouchStart(e.touches[0].clientX);
//   };

//   const handleTouchMove = (e: TouchEvent) => {
//     if (!touchStart) return;
    
//     const diff = touchStart - e.touches[0].clientX;

//     if (Math.abs(diff) > 50) {
//       if (diff > 0 && currentIndex < images.length - 1) {
//         setCurrentIndex(prev => prev + 1);
//       } else if (diff < 0 && currentIndex > 0) {
//         setCurrentIndex(prev => prev - 1);
//       }
//       setTouchStart(null);
//     }
//   };

//   return (
//     <div className={styles.carousel}>
//       <div 
//         className={styles.container}
//         onTouchStart={handleTouchStart}
//         onTouchMove={handleTouchMove}
//       >
//         <Image
//           src={images[currentIndex].original}
//           alt={`${title} ${currentIndex + 1}`}
//           fill
//           style={{ objectFit: 'contain' }}
//           quality={100}
//           priority
//           className={styles.image}
//         />
//       </div>
      
//       {images.length > 1 && (
//         <div className={styles.pagination}>
//           {images.map((_, index) => (
//             <button
//               key={index}
//               className={`${styles.dot} ${index === currentIndex ? styles.active : ''}`}
//               onClick={() => setCurrentIndex(index)}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default ImageCarousel;

import { FC, TouchEvent, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './ImageCarousel.module.scss';

interface ImageCarouselProps {
  images: {
    original: string;
  }[];
  title: string;
}

const ImageCarousel: FC<ImageCarouselProps> = ({ images, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchMove, setTouchMove] = useState<{ x: number; y: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]));
  const [swipeDirection, setSwipeDirection] = useState<'horizontal' | 'vertical' | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Предзагрузка изображений
  useEffect(() => {
    // Создаем новый Set с текущими загруженными изображениями
    const newLoadedImages = new Set(loadedImages);
    
    // Добавляем текущее изображение
    newLoadedImages.add(currentIndex);
    
    // Добавляем следующее изображение (если есть)
    if (currentIndex + 1 < images.length) {
      newLoadedImages.add(currentIndex + 1);
    }
    
    // Добавляем предыдущее изображение (если есть)
    if (currentIndex - 1 >= 0) {
      newLoadedImages.add(currentIndex - 1);
    }
    
    setLoadedImages(newLoadedImages);
  }, [currentIndex, images.length]);

  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
    setTouchMove(null);
    setSwipeDirection(null);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStart) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = touchStart.x - currentX;
    const deltaY = touchStart.y - currentY;

    // Определяем направление свайпа при первом движении
    if (!swipeDirection) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        setSwipeDirection('horizontal');
        // Предотвращаем прокрутку страницы при горизонтальном свайпе
        e.preventDefault();
      } else {
        setSwipeDirection('vertical');
        // При вертикальном свайпе не блокируем прокрутку и выходим
        return;
      }
    } else if (swipeDirection === 'vertical') {
      // Если свайп вертикальный, не обрабатываем его для карусели
      return;
    } else {
      // Предотвращаем прокрутку страницы при горизонтальном свайпе
      e.preventDefault();
    }

    setTouchMove({
      x: currentX,
      y: currentY
    });
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStart || !touchMove || swipeDirection !== 'horizontal') {
      setTouchStart(null);
      setTouchMove(null);
      return;
    }

    const deltaX = touchStart.x - touchMove.x;
    const threshold = 50; // Минимальное расстояние для свайпа
    
    // Если свайп достаточно длинный, меняем изображение
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && currentIndex < images.length - 1) {
        goToSlide(currentIndex + 1);
      } else if (deltaX < 0 && currentIndex > 0) {
        goToSlide(currentIndex - 1);
      }
    }

    setTouchStart(null);
    setTouchMove(null);
  };

  const goToSlide = (index: number) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setCurrentIndex(index);
    
    // Сбрасываем флаг анимации после завершения перехода
    setTimeout(() => {
      setIsAnimating(false);
    }, 300); // Должно соответствовать длительности CSS-анимации
  };

  // Функция для определения стиля трансформации
  const getSlideStyle = (index: number) => {
    // Базовый стиль для всех слайдов (скрыты по умолчанию)
    let transform = 'translateX(100%)';
    let opacity = 0;
    let zIndex = 0;
    
    // Текущий слайд
    if (index === currentIndex) {
      transform = 'translateX(0)';
      opacity = 1;
      zIndex = 3;
    } 
    // Предыдущий слайд
    else if (index === currentIndex - 1) {
      transform = 'translateX(-100%)';
      opacity = 0;
      zIndex = 2;
    } 
    // Следующий слайд
    else if (index === currentIndex + 1) {
      transform = 'translateX(100%)';
      opacity = 0;
      zIndex = 2;
    }
    
    // Если происходит свайп, показываем смещение
    if (touchStart && touchMove && swipeDirection === 'horizontal') {
      const deltaX = touchStart.x - touchMove.x;
      const maxDelta = carouselRef.current?.offsetWidth || 300;
      const movePercent = Math.min(Math.abs(deltaX) / maxDelta, 1) * 100;
      
      if (index === currentIndex) {
        // Текущий слайд смещается влево или вправо
        transform = `translateX(${deltaX > 0 ? -movePercent : movePercent}%)`;
        opacity = 1 - (movePercent / 200);
      } 
      else if (index === currentIndex + 1 && deltaX > 0) {
        // Следующий слайд выезжает справа
        transform = `translateX(${100 - movePercent}%)`;
        opacity = movePercent / 100;
        zIndex = 2;
      } 
      else if (index === currentIndex - 1 && deltaX < 0) {
        // Предыдущий слайд выезжает слева
        transform = `translateX(${-100 + movePercent}%)`;
        opacity = movePercent / 100;
        zIndex = 2;
      }
    }
    
    return {
      transform,
      opacity,
      zIndex
    };
  };

  return (
    <div 
      className={styles.carousel}
      ref={carouselRef}
    >
      <div 
        className={styles.container}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Отображаем все слайды */}
        {images.map((image, index) => (
          <div 
            key={index}
            className={`${styles.slide} ${index === currentIndex ? styles.active : ''}`}
            style={getSlideStyle(index)}
          >
            {(loadedImages.has(index) || Math.abs(index - currentIndex) <= 1) && (
              <Image
                src={image.original}
                alt={`${title} ${index + 1}`}
                fill
                style={{ objectFit: 'contain' }}
                quality={90}
                priority={index === currentIndex}
                className={styles.image}
                loading={index === currentIndex ? "eager" : "lazy"}
              />
            )}
          </div>
        ))}
      </div>
      
      {images.length > 1 && (
        <div className={styles.pagination}>
          {images.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentIndex ? styles.active : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Перейти к изображению ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;