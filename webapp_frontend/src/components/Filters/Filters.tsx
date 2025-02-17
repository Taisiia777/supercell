
import { useState } from 'react';
import styles from './filters.module.scss';

interface Filters {
  newAccount: boolean;
  promotions: boolean;
  passes: boolean;
  gems: boolean;

}

interface FiltersProps {
  onFilterChange: (filters: Filters) => void;
}

const filterCategories = [
  { id: 'passes' as const, label: 'Пропуски' },
  { id: 'promotions' as const, label: 'Акции' },
  { id: 'gems' as const, label: 'Гемы' },
  { id: 'newAccount' as const, label: 'Новый аккаунт' },
] as const;

export default function Filters({ onFilterChange }: FiltersProps) {
  const [activeFilter, setActiveFilter] = useState<keyof Filters | null>(null);

  const handleFilterClick = (filterId: keyof Filters) => {
    // Если кликнули по активному фильтру - сбрасываем его
    if (activeFilter === filterId) {
      setActiveFilter(null);
      // Сбрасываем все фильтры, чтобы показать все товары
      onFilterChange({
        newAccount: false,
        promotions: false,
        passes: false,
        gems: false
      });
    } else {
      // Иначе активируем новый фильтр
      setActiveFilter(filterId);
      const newFilters = {
        newAccount: false,
        promotions: false,
        passes: false,
        gems: false,
        [filterId]: true
      };
      onFilterChange(newFilters);
    }
  };

  return (
    <div className={styles.filters}>
      <div className={styles.scroll_container}>
        <div className={styles.categories}>
          {filterCategories.map(filter => (
            <div
              key={filter.id}
              className={`${styles.category} ${activeFilter === filter.id ? styles.active : ''}`}
              onClick={() => handleFilterClick(filter.id)}
            >
              {filter.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}