
// import { useState } from "react";
// import style from "./ProductsPage.module.css";

// import TablePage from "../../../components/TablePage/TablePage";
// import { davDamerAPI } from "../../../store/api/DavdamerAPI";
// import { IParamsAPI } from "../../../store/api/DavdamerAPI";



// function ProductsPage() {
//     const [paramsAPI, setParamsAPI] = useState<IParamsAPI>({
//         ordering: ""

//     });



//     const { data, error, isLoading } = davDamerAPI.useFetchAllProductsQuery(paramsAPI);

//     const setParamsFilter = (key: string, value: string | number) => {
//         setParamsAPI(() => {
//             const obj = Object.assign({}, paramsAPI);
//             if (key === "nameSeller") {
//                 obj["seller"] = value ? value : ""
//             } else obj[key] = value

//             return obj
//         });

//     }



//     if (isLoading) return (<p>Загрузка данных</p>)
//     if (error) return (<p>Ошибка</p>)

//     return (
//         data && <TablePage setParamsFilter={setParamsFilter} style={style} nameTable="products" products={data} lengthRow={data.length}></TablePage>)
// }

// export default ProductsPage





import { useState, useRef, useEffect, useMemo } from "react";
import style from "./ProductsPage.module.css";
import TablePage from "../../../components/TablePage/TablePage";
import { davDamerAPI } from "../../../store/api/DavdamerAPI";
import { IParamsAPI } from "../../../store/api/DavdamerAPI";
import { IProduct } from "../../../models/type";

// Функции localStorage
const saveToLocalStorage = (key: string, data: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Ошибка сохранения в localStorage:", e);
  }
};

const getFromLocalStorage = <T,>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) as T : null;
  } catch (e) {
    console.error("Ошибка получения из localStorage:", e);
    return null;
  }
};

interface ICatalogCache {
  products: IProduct[] | null;
  paramsAPI: IParamsAPI;
  timestamp: number | null;
}

const catalogCache: ICatalogCache = {
  products: null,
  paramsAPI: { ordering: "" },
  timestamp: null
};

const CACHE_TTL = 3600000; // 1 час
const ITEMS_PER_PAGE = 20; // Количество товаров на странице

function ProductsPage() {
  const [paramsAPI, setParamsAPI] = useState<IParamsAPI>(catalogCache.paramsAPI);
  const [forceRefresh, setForceRefresh] = useState(false);
  const isInitialMount = useRef(true);
  const isCacheValid = useRef(false);
  
  // Состояния для пагинации
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredProducts, setFilteredProducts] = useState<IProduct[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, string | number>>({});

  // Загрузка данных из localStorage при монтировании
  useEffect(() => {
    const storedProducts = getFromLocalStorage<IProduct[]>('catalog-products');
    const storedParams = getFromLocalStorage<IParamsAPI>('catalog-params');
    const storedTimestamp = getFromLocalStorage<number>('catalog-timestamp');
    
    const isExpired = storedTimestamp && (Date.now() - storedTimestamp > CACHE_TTL);
    
    if (storedProducts && storedParams && storedTimestamp && !isExpired) {
      catalogCache.products = storedProducts;
      catalogCache.paramsAPI = storedParams;
      catalogCache.timestamp = storedTimestamp;
      setParamsAPI(storedParams);
      isCacheValid.current = true;
      setFilteredProducts(storedProducts);
    }
  }, []);

  // Запрос данных с API, с пропуском если есть валидный кэш
  const { data, error, isLoading, refetch } = davDamerAPI.useFetchAllProductsQuery(paramsAPI, {
    skip: !forceRefresh && isInitialMount.current && isCacheValid.current,
  });

  // Сохраняем данные в кэш при их получении
  useEffect(() => {
    if (data) {
      catalogCache.products = data;
      catalogCache.paramsAPI = paramsAPI;
      catalogCache.timestamp = Date.now();
      
      saveToLocalStorage('catalog-products', data);
      saveToLocalStorage('catalog-params', paramsAPI);
      saveToLocalStorage('catalog-timestamp', catalogCache.timestamp);
      
      isInitialMount.current = false;
      setFilteredProducts(data);
    }
  }, [data]);

  // Определяем полный набор товаров (или из кэша или с сервера)
  const allProducts = useMemo(() => {
    return (isInitialMount.current && isCacheValid.current && catalogCache.products) 
      ? catalogCache.products 
      : data;
  }, [data]);

  // Применение фильтров ко всему набору товаров
  useEffect(() => {
    if (!allProducts) return;
    
    let filtered = [...allProducts];
    
    // Применяем каждый активный фильтр к списку товаров
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (!value) return;
      
      switch (key) {
        case "category":
          filtered = filtered.filter(product => 
            product.categories.some(cat => cat.toLowerCase().includes(String(value).toLowerCase()))
          );
          break;
        case "title":
          filtered = filtered.filter(product => 
            product.title.toLowerCase().includes(String(value).toLowerCase())
          );
          break;
        case "price_min":
          filtered = filtered.filter(product => 
            parseFloat(product.price.incl_tax) >= Number(value)
          );
          break;
        case "price_max":
          filtered = filtered.filter(product => 
            parseFloat(product.price.incl_tax) <= Number(value)
          );
          break;
        case "seller":
          filtered = filtered.filter(product => 
            product.seller.name.toLowerCase().includes(String(value).toLowerCase())
          );
          break;
        // Можно добавить дополнительные кейсы для других фильтров
      }
    });
    
    // Применяем сортировку на основе paramsAPI.ordering
    if (paramsAPI.ordering) {
      const ordering = paramsAPI.ordering.toString();
      const isDesc = ordering.startsWith('-');
      const field = isDesc ? ordering.substring(1) : ordering;
      
      filtered.sort((a, b) => {
        let valueA: any, valueB: any; // Объявляем явные типы
        
        // Извлекаем значения в зависимости от поля сортировки
        switch (field) {
          case "title":
            valueA = a.title.toLowerCase();
            valueB = b.title.toLowerCase();
            break;
          case "price":
            valueA = parseFloat(a.price.incl_tax);
            valueB = parseFloat(b.price.incl_tax);
            break;
          case "orders_count":
            valueA = a.orders_count;
            valueB = b.orders_count;
            break;
          default:
            valueA = a[field as keyof IProduct];
            valueB = b[field as keyof IProduct];
        }
        
        // Сравниваем и учитываем направление сортировки
        if (valueA < valueB) return isDesc ? 1 : -1;
        if (valueA > valueB) return isDesc ? -1 : 1;
        return 0;
      });
    }
    
    setFilteredProducts(filtered);
    // Сбрасываем текущую страницу при изменении фильтров
    setCurrentPage(1);
  }, [allProducts, activeFilters, paramsAPI.ordering]);

  // Извлекаем только товары для текущей страницы
  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Расчет общего количества страниц
  const totalPages = useMemo(() => {
    return Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  }, [filteredProducts.length]);

  // Функция установки параметров фильтра с поддержкой пагинации
  const setParamsFilter = (key: string, value: string | number): void => {
    // Обновляем состояние API запроса (для сортировки)
    setParamsAPI(prev => {
      const newParams = { ...prev };
      
      // Специальная обработка для сортировки и фильтра продавца
      if (key === "ordering") {
        newParams[key] = value;
      } else if (key === "nameSeller") {
        newParams["seller"] = value ? value : "";
        // Также обновляем активные фильтры
        setActiveFilters(prev => ({ ...prev, seller: value }));
      } else {
        // Обновляем активные фильтры для других параметров
        setActiveFilters(prev => ({ ...prev, [key]: value }));
      }
      
      return newParams;
    });
    
    // Сбрасываем текущую страницу при изменении фильтров
    setCurrentPage(1);
  };

  // Функция поиска по наименованию товара
  const handleSearch = (searchTerm: string): void => {
    setActiveFilters(prev => ({ ...prev, title: searchTerm }));
    setCurrentPage(1);
  };

  // Обработчик принудительного обновления
  const handleRefresh = (): void => {
    setForceRefresh(true);
    setCurrentPage(1);
    setActiveFilters({});
    
    refetch().then(() => {
      setForceRefresh(false);
    }).catch(error => {
      console.error("Ошибка обновления данных:", error);
      setForceRefresh(false);
    });
  };

  // Переключение страниц
  const handlePageChange = (pageNumber: number): void => {
    setCurrentPage(pageNumber);
  };

  // Если начальная загрузка и нет кэша
  if (isLoading && filteredProducts.length === 0) {
    return <div className="loading-container">Загрузка каталога...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Произошла ошибка при загрузке каталога</p>
        <button onClick={handleRefresh} className="btn__head btn__active">
          Повторить попытку
        </button>
      </div>
    );
  }

  return (
    <div className="products-page-container">
      {/* Кнопка обновления каталога */}
      <div className="refresh-button-container" style={{ padding: '10px', textAlign: 'right' }}>
        <button 
          onClick={handleRefresh} 
          disabled={isLoading || forceRefresh}
          className={`btn__head ${forceRefresh ? '' : 'btn__active'}`}
          style={{
            opacity: forceRefresh ? 0.7 : 1,
            cursor: forceRefresh ? 'not-allowed' : 'pointer'
          }}
        >
          {forceRefresh ? 'Обновление...' : 'Обновить каталог'}
        </button>
      </div>
      
      {/* Поле поиска по наименованию */}
      <div style={{ padding: '0 40px', marginBottom: '15px' }}>
        <input 
          type="text"
          placeholder="Поиск по наименованию"
          value={activeFilters.title as string || ''}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            width: '300px'
          }}
        />
      </div>
      
      {/* Информация о результатах фильтрации */}
      <div style={{ padding: '0 40px', marginBottom: '15px', color: '#7D7D7D' }}>
        Найдено товаров: {filteredProducts.length} из {allProducts?.length || 0}
        {filteredProducts.length > ITEMS_PER_PAGE && 
          ` (страница ${currentPage} из ${totalPages})`
        }
      </div>
      
      {/* Отображение таблицы с товарами текущей страницы */}
      {currentProducts.length > 0 ? (
        <TablePage 
          setParamsFilter={setParamsFilter} 
          style={style} 
          nameTable="products" 
          products={currentProducts} 
          lengthRow={currentProducts.length}
        />
      ) : (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          background: '#fff',
          margin: '0 40px',
          borderRadius: '8px',
          color: '#7D7D7D'
        }}>
          По вашему запросу ничего не найдено
        </div>
      )}
      
      {/* Пагинация */}
      {totalPages > 1 && (
        <div style={{ 
          padding: '20px 40px', 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '5px'
        }}>
          {/* Кнопка "Предыдущая" */}
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn__head"
            style={{
              opacity: currentPage === 1 ? 0.5 : 1,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            &laquo;
          </button>
          
          {/* Номера страниц */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Явно указываем тип для pageNum
            let pageNum: number;
            
            if (totalPages <= 5) {
              // Если всего страниц меньше или равно 5, показываем все
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              // Если текущая страница близка к началу
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              // Если текущая страница близка к концу
              pageNum = totalPages - 4 + i;
            } else {
              // Если текущая страница в середине
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button 
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`btn__head ${currentPage === pageNum ? 'btn__active' : ''}`}
              >
                {pageNum}
              </button>
            );
          })}
          
          {/* Многоточие если много страниц */}
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <span style={{ alignSelf: 'center', padding: '0 5px' }}>...</span>
          )}
          
          {/* Последняя страница, если много страниц */}
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <button 
              onClick={() => handlePageChange(totalPages)}
              className="btn__head"
            >
              {totalPages}
            </button>
          )}
          
          {/* Кнопка "Следующая" */}
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn__head"
            style={{
              opacity: currentPage === totalPages ? 0.5 : 1,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            &raquo;
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductsPage;