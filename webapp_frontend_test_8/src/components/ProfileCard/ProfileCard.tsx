
'use client'
import React, { useState, useEffect, useRef } from 'react';
import { useTelegram } from '@/app/useTg';
import styles from './ProfileCard.module.scss';
interface ProfileCardProps {
  profileId?: string | number; // Опциональный параметр ID профиля
}
const ProfileCard: React.FC<ProfileCardProps> = ({ profileId }) => {
  const { user, webApp } = useTelegram();
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Создаем рефы для доступа к DOM-элементам
  const cardRef = useRef<HTMLDivElement>(null);
  const glowEffectRef = useRef<HTMLDivElement>(null);
  
  // Анимация появления при загрузке
  useEffect(() => {
    setIsVisible(true);
    
    // Создаем эффект перемещения для фоновых элементов
    const handleMouseMove = (e: MouseEvent): void => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const moveX = (x - centerX) / 30;
        const moveY = (y - centerY) / 30;
        
        if (glowEffectRef.current) {
          glowEffectRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  const copyUsername = () => {
    if (user?.username) {
      navigator.clipboard.writeText('@' + user.username);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  if (!user) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingRing}>
          <div></div><div></div><div></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${styles.profileContainer} ${isVisible ? styles.visible : ''}`}>
      <div className={styles.profileCard} ref={cardRef}>
        <div className={styles.glassPane}></div>
        <div className={styles.glowEffect} ref={glowEffectRef}></div>
        
        <div className={styles.avatarSection}>
          <div className={styles.avatarDecorator}>
            <div className={styles.avatarDecoratorInner}></div>
          </div>
          <div className={styles.avatarWrapper}>
            {user.photo_url ? (
              <img 
                src={user.photo_url} 
                alt={user.first_name} 
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {user.first_name ? user.first_name[0] : 'U'}
              </div>
            )}
            <div className={styles.avatarRing}></div>
          </div>
        </div>
        
        <div className={styles.usernameSection}>
          <div className={styles.usernameWrapper}>
            <h2 className={styles.name}>
              {user.first_name} {user.last_name || ''}
            </h2>
            <div className={styles.username}>
              <span>{profileId|| 'hortongaming'}</span>
              <button 
                onClick={copyUsername}
                className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
                aria-label="Копировать имя пользователя"
              >
                {copied ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 5H3C1.89543 5 1 5.89543 1 7V19C1 20.1046 1.89543 21 3 21H15C16.1046 21 17 20.1046 17 19V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 1H12C10.8954 1 10 1.89543 10 3V12C10 13.1046 10.8954 14 12 14H21C22.1046 14 23 13.1046 23 12V3C23 1.89543 22.1046 1 21 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ProfileCard;