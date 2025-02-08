
// import { useState } from 'react';
// import styles from './filters.module.scss';

// interface Filters {
//   newAccount: boolean;
//   promotions: boolean;
//   passesGems: boolean;
// }

// interface FiltersProps {
//   onFilterChange: (filters: Filters) => void;
// }

// const filterCategories = [
//   { id: 'newAccount' as const, label: 'Новый аккаунт' },
//   { id: 'promotions' as const, label: 'Акции' },
//   { id: 'passesGems' as const, label: 'Пропуски/Гемы' }
// ] as const;

// export default function Filters({ onFilterChange }: FiltersProps) {
//   const [isOpen, setIsOpen] = useState(false);
//   const [selectedFilters, setSelectedFilters] = useState<Filters>({
//     newAccount: false,
//     promotions: false,
//     passesGems: false
//   });

//   const handleFilterClick = (filterId: keyof Filters) => {
//     const newFilters = {
//       ...selectedFilters,
//       [filterId]: !selectedFilters[filterId]
//     };
//     setSelectedFilters(newFilters);
//     onFilterChange(newFilters);
//   };

//   return (
//     <div className={styles.filters}>
//       <div className={styles.header} onClick={() => setIsOpen(!isOpen)}>
//         <span>Фильтры</span>
//         <svg 
//           className={`${styles.arrow} ${isOpen ? styles.open : ''}`}
//           width="12" height="8" viewBox="0 0 12 8" fill="none"
//         >
//           <path d="M1 1L6 6L11 1" stroke="white" strokeWidth="2"/>
//         </svg>
//       </div>

//       <div className={`${styles.content} ${isOpen ? styles.open : ''}`}>
//         <div className={styles.categories}>
//           {filterCategories.map(filter => (
//             <div
//               key={filter.id}
//               className={`${styles.category} ${selectedFilters[filter.id] ? styles.active : ''}`}
//               onClick={() => handleFilterClick(filter.id)}
//             >
//               {filter.label}
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
import { useState } from 'react';
import styles from './filters.module.scss';

interface Filters {
  newAccount: boolean;
  promotions: boolean;
  passesGems: boolean;
}

interface FiltersProps {
  onFilterChange: (filters: Filters) => void;
}

const filterCategories = [
  { id: 'newAccount' as const, label: 'Новый аккаунт' },
  { id: 'promotions' as const, label: 'Акции' },
  { id: 'passesGems' as const, label: 'Пропуски/Гемы' }
] as const;

export default function Filters({ onFilterChange }: FiltersProps) {
  const [selectedFilters, setSelectedFilters] = useState<Filters>({
    newAccount: false,
    promotions: false,
    passesGems: false
  });

  const handleFilterClick = (filterId: keyof Filters) => {
    const newFilters = {
      ...selectedFilters,
      [filterId]: !selectedFilters[filterId]
    };
    setSelectedFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className={styles.filters}>
      <div className={styles.categories}>
        {filterCategories.map(filter => (
          <div
            key={filter.id}
            className={`${styles.category} ${selectedFilters[filter.id] ? styles.active : ''}`}
            onClick={() => handleFilterClick(filter.id)}
          >
            {filter.label}
          </div>
        ))}
      </div>
    </div>
  );
}