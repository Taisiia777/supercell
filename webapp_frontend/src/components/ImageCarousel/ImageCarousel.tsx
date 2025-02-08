// ImageCarousel.tsx
import { FC, TouchEvent, useState } from 'react';
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
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStart) return;
    
    const diff = touchStart - e.touches[0].clientX;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < images.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
      setTouchStart(null);
    }
  };

  return (
    <div className={styles.carousel}>
      <div 
        className={styles.container}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <Image
          src={images[currentIndex].original}
          alt={`${title} ${currentIndex + 1}`}
          fill
          style={{ objectFit: 'contain' }}
          quality={100}
          priority
          className={styles.image}
        />
      </div>
      
      {images.length > 1 && (
        <div className={styles.pagination}>
          {images.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentIndex ? styles.active : ''}`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;