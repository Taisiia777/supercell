// 'use client'
// import React, { useState, useEffect, useRef } from 'react';
// import styles from './BalanceCard.module.scss';

// interface BalanceCardProps {
//   balance?: number;
//   title?: string;
//   currencySymbol?: string;
// }

// const BalanceCard: React.FC<BalanceCardProps> = ({ 
//   balance = 0, 
//   title = 'Баланс', 
//   currencySymbol = '₽' 
// }) => {
//   const [isVisible, setIsVisible] = useState(false);
  
//   // Создаем рефы для доступа к DOM-элементам с правильными типами
//   const cardRef = useRef<HTMLDivElement>(null);
//   const glowEffectRef = useRef<HTMLDivElement>(null);
  
//   // Анимация появления при загрузке
//   useEffect(() => {
//     setIsVisible(true);
    
//     // Создаем эффект перемещения для фоновых элементов с правильной типизацией события
//     const handleMouseMove = (e: MouseEvent) => {
//       if (cardRef.current) {
//         const rect = cardRef.current.getBoundingClientRect();
//         const x = e.clientX - rect.left;
//         const y = e.clientY - rect.top;
        
//         const centerX = rect.width / 2;
//         const centerY = rect.height / 2;
        
//         const moveX = (x - centerX) / 30;
//         const moveY = (y - centerY) / 30;
        
//         if (glowEffectRef.current) {
//           glowEffectRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`;
//         }
//       }
//     };
    
//     window.addEventListener('mousemove', handleMouseMove);
    
//     return () => {
//       window.removeEventListener('mousemove', handleMouseMove);
//     };
//   }, []);
  
//   return (
//     <div className={`${styles.balanceContainer} ${isVisible ? styles.visible : ''}`}>
//       <div className={styles.balanceCard} ref={cardRef}>
//         <div className={styles.glassPane}></div>
//         <div className={styles.glowEffect} ref={glowEffectRef}></div>
        
//         <div className={styles.balanceSection}>
//           <div className={styles.balanceDecorator}>
//             <div className={styles.balanceDecoratorInner}></div>
//           </div>
//           <div className={styles.balanceWrapper}>
//             <div className={styles.balancePlaceholder}>
//               <span className={styles.amount}>{balance} {currencySymbol}</span>
//               {/* <span className={styles.symbol}>{currencySymbol}</span> */}
//             </div>
//             <div className={styles.balanceRing}></div>
//           </div>
//         </div>
        
//         <div className={styles.titleSection}>
//           <div className={styles.titleWrapper}>
//             <h2 className={styles.title}>
//               {title}
//             </h2>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BalanceCard;

'use client'
import React, { useState, useEffect, useRef } from 'react';
import styles from './BalanceCard.module.scss'; // используем те же стили!

interface BalanceCardProps {
  balance?: number;
  title?: string;
  currencySymbol?: string;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ 
  balance = 0, 
  title = 'Реферальный баланс', 
  currencySymbol = '₽' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  // Те же рефы, как в ProfileCard
  const cardRef = useRef<HTMLDivElement>(null);
  const glowEffectRef = useRef<HTMLDivElement>(null);
  
  // Та же анимация, как в ProfileCard
  useEffect(() => {
    setIsVisible(true);
    
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
  
  return (
    // Используем те же классы, что и в ProfileCard
    <div className={`${styles.profileContainer} ${isVisible ? styles.visible : ''}`}>
      <div className={styles.profileCard} ref={cardRef}>
        <div className={styles.glassPane}></div>
        <div className={styles.glowEffect} ref={glowEffectRef}></div>
        
        {/* Та же секция avatarSection, но с балансом внутри */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarDecorator}>
            <div className={styles.avatarDecoratorInner}></div>
          </div>
          <div className={styles.avatarWrapper}>
            {/* Вместо аватарки - баланс */}
            <div className={styles.avatarPlaceholder} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #2A3B67, #375AAB)'
            }}>
              <span style={{
                fontSize: '36px',
                fontWeight: 700
              }}>{balance} {currencySymbol}</span>
              {/* <span style={{
                fontSize: '20px',
                color: '#6AEC3D',
                marginTop: '5px'
              }}>{currencySymbol}</span> */}
            </div>
            <div className={styles.avatarRing}></div>
          </div>
        </div>
        
        {/* Заменяем секцию с именем на заголовок баланса */}
        <div className={styles.usernameSection}>
          <div className={styles.usernameWrapper}>
            <h2 className={styles.name}>
              {title}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;