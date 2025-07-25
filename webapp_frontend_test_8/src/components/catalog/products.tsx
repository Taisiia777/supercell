

// 'use client'
// import styles from "./products.module.scss"
// import CatalogMenu from "@/components/catalog/menu/menu";
// import {IProduct} from "@/types/products.interface";
// import Link from "next/link";
// import Image from "next/image";
// import {Shimmer} from "react-shimmer";
// import shimmer from "@/components/ui/shimmer/shimmer.module.scss";
// import ButtonAdd from "@/components/ui/button-add/button";
// import ActionButtons from "@/components/ui/action-buttons/action-buttons";
// import {useEffect, useState, useRef} from "react";
// import {useCart} from "@/components/store/store";
// import {CartItem} from "@/types/store.interface";
// import { useLastViewedStore } from "@/components/store/lastViewedStore";
// import Filters from "../Filters/Filters";

// interface Filters {
//     newAccount: boolean;
//     promotions: boolean;
//     passes: boolean;
//     gems: boolean;
// }

// // Ключи для хранения данных в localStorage
// const CATALOG_STORAGE_KEY = 'cached_catalog_data';
// const FILTERS_STORAGE_KEY = 'cached_filters_state';

// export default function Products(props: { data: IProduct[] }) {
//     const { items } = useCart();
//     const [clientItems, setClientItems] = useState<CartItem[]>([]);
//     const { lastViewedProductId, setLastViewedProduct, clearLastViewedProduct } = useLastViewedStore();
//     const [isLoading, setLoading] = useState(false);
//     const [filteredProducts, setFilteredProducts] = useState<IProduct[]>([]);
//     const [activeFilters, setActiveFilters] = useState<Filters>({
//         newAccount: false,
//         promotions: false,
//         passes: false,
//         gems: false
//     });
    
//     // Используем ref для хранения ссылок на элементы товаров
//     const productRefs = useRef<Record<number, HTMLElement | null>>({});
//     // Флаг для отслеживания первой загрузки данных
//     const initialDataLoaded = useRef(false);
//     // Флаг для отслеживания попытки прокрутки
//     const scrollAttempted = useRef(false);
    
//     // Обновление товаров корзины при их изменении
//     useEffect(() => {
//         setClientItems(items);
//     }, [items]);

//     // Функция для применения фильтров
//     const applyFilters = (products: IProduct[], filters: Filters) => {
//         // Если все фильтры отключены - возвращаем все товары
//         if (!filters.newAccount && !filters.promotions && !filters.passes && !filters.gems) {
//             return products;
//         } else {
//             // Иначе фильтруем по активным фильтрам
//             return products.filter(product => {
//                 return (
//                     (filters.newAccount && product.filters_type === "NEW_ACCOUNT") ||
//                     (filters.promotions && product.filters_type === "PROMO") ||
//                     (filters.passes && product.filters_type === "PASS") || 
//                     (filters.gems && product.filters_type === "GEMS")
//                 );
//             });
//         }
//     };

//     // Инициализация данных каталога с возможным использованием кэша
//     useEffect(() => {
//         if (initialDataLoaded.current) return;

//         const loadCatalogData = () => {
//             setLoading(true);
            
//             try {
//                 // Пробуем получить данные и фильтры из localStorage
//                 const cachedDataStr = localStorage.getItem(CATALOG_STORAGE_KEY);
//                 const cachedFiltersStr = localStorage.getItem(FILTERS_STORAGE_KEY);
                
//                 let dataToUse: IProduct[] = props.data;
//                 let filtersToUse: Filters = {
//                     newAccount: false,
//                     promotions: false,
//                     passes: false,
//                     gems: false
//                 };
                
//                 // Если есть кэшированные данные, используем их
//                 if (cachedDataStr) {
//                     try {
//                         const parsedData = JSON.parse(cachedDataStr) as IProduct[];
//                         dataToUse = parsedData;
//                     } catch (parseError) {
//                         console.error('Ошибка при парсинге кэшированных данных:', parseError);
//                     }
//                 }
                
//                 // Если есть кэшированные фильтры, используем их
//                 if (cachedFiltersStr) {
//                     try {
//                         const parsedFilters = JSON.parse(cachedFiltersStr) as Filters;
//                         filtersToUse = parsedFilters;
//                         setActiveFilters(parsedFilters);
//                     } catch (parseError) {
//                         console.error('Ошибка при парсинге кэшированных фильтров:', parseError);
//                     }
//                 }
                
//                 // Всегда кэшируем актуальные данные из пропсов
//                 localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(props.data));
                
//                 // Применяем фильтры и устанавливаем данные
//                 const filtered = applyFilters(dataToUse, filtersToUse);
//                 setFilteredProducts(filtered);
                
//                 initialDataLoaded.current = true;
//             } catch (error) {
//                 console.error('Ошибка при загрузке/кэшировании данных:', error);
//                 setFilteredProducts(props.data);
//             } finally {
//                 // Имитируем загрузку в течение короткого времени для плавности
//                 const timeoutId = setTimeout(() => {
//                     setLoading(false);
//                 }, 1); // Сокращенное время загрузки с 1000мс до 300мс

//                 return () => clearTimeout(timeoutId);
//             }
//         };
        
//         loadCatalogData();
//     }, [props.data]);

//     // Обработчик изменения фильтров
//     const handleFilterChange = (filters: Filters) => {
//         setActiveFilters(filters);
        
//         // Сохраняем состояние фильтров в localStorage
//         localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
        
//         try {
//             // Всегда используем актуальные данные из пропсов для фильтрации
//             const filtered = applyFilters(props.data, filters);
//             setFilteredProducts(filtered);
//         } catch (error) {
//             console.error('Ошибка при применении фильтров:', error);
//         }
//     };


// // На этот более надежный код:
// useEffect(() => {
//     // Проверяем наличие lastViewedProductId
//     if (!lastViewedProductId) return;
    
//     // Счетчик попыток скролла и максимальное количество попыток
//     let scrollAttempts = 0;
//     const maxScrollAttempts = 10;
    
//     // Функция для выполнения скролла
//     const tryScrollToProduct = () => {
//         const element = productRefs.current[lastViewedProductId];
//         scrollAttempts++;
        
//         // Если элемент существует, скроллим к нему
//         if (element) {
//             // Небольшая задержка для гарантированного выполнения скролла
//             setTimeout(() => {
//                 // Используем мгновенную прокрутку к элементу
//                 element.scrollIntoView({
//                     behavior: 'auto', 
//                     block: 'center'
//                 });
                
//                 // Очищаем lastViewedProductId после прокрутки
//                 clearLastViewedProduct();
//             }, 1);
            
//             return true; // Скролл успешно выполнен
//         }
        
//         // Если превышено максимальное количество попыток, прекращаем
//         if (scrollAttempts >= maxScrollAttempts) {
//             console.log('Превышено количество попыток скролла');
//             clearLastViewedProduct();
//             return true; // Прекращаем попытки
//         }
        
//         return false; // Продолжаем попытки
//     };
    
//     // Интервал для попыток скролла
//     const scrollInterval = setInterval(() => {
//         if (tryScrollToProduct()) {
//             clearInterval(scrollInterval);
//         }
//     }, 100); // Пробуем каждые 100мс
    
//     // Очищаем интервал при размонтировании компонента
//     return () => {
//         clearInterval(scrollInterval);
//     };
// }, [lastViewedProductId, clearLastViewedProduct]);

//     // Обновляем фильтрованные продукты при изменении списка товаров
//     useEffect(() => {
//         if (initialDataLoaded.current) {
//             const filtered = applyFilters(props.data, activeFilters);
//             setFilteredProducts(filtered);
//         }
//     }, [props.data]);

//     // Функция для сохранения ссылки на элемент товара
//     const setProductRef = (id: number, element: HTMLElement | null): void => {
//         productRefs.current[id] = element;
//     };

//     // Обработчик клика по товару - сохраняем его ID
//     const handleProductClick = (id: number): void => {
//         setLastViewedProduct(id);
//     };

//     return (
//         <div className={styles.products}>
//             <CatalogMenu/>
//             <Filters onFilterChange={handleFilterChange} />
//             <div className={styles.items}>
//                 {filteredProducts.map((product: IProduct) => {
//                     const cartItem = clientItems.find((i) => i.id === product.id)
//                     const count = cartItem ? cartItem.count : 0
//                     const isLastViewed = product.id === lastViewedProductId;

//                     return (
//                         <Link 
//                             href={`/product/${product.id}`} 
//                             key={product.id} 
//                             className={`${styles.item} ${isLastViewed ? styles.lastViewed : ''}`}
//                             onClick={() => handleProductClick(product.id)}
//                             ref={(el) => setProductRef(product.id, el)}
//                         >
//                             <div className={styles.types}>
//                                 <div className={styles.type}>
//                                     <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
//                                         <path d="M3.17317 3.3274H3.17916M5.24464 0.666664H3.62205C2.61674 0.666664 2.11408 0.666664 1.73011 0.881492C1.39235 1.07046 1.11774 1.37199 0.945647 1.74286C0.75 2.16448 0.75 2.71641 0.75 3.82029V5.60195C0.75 6.084 0.75 6.32505 0.799597 6.55192C0.843569 6.75303 0.916094 6.94527 1.01452 7.12167C1.12552 7.32055 1.28075 7.49097 1.59121 7.83189L4.40342 10.9198C5.11426 11.7003 5.46974 12.0907 5.87954 12.2369C6.2401 12.3655 6.62843 12.3655 6.98899 12.2369C7.3988 12.0907 7.75427 11.7003 8.4651 10.9198L10.0877 9.13815C10.7985 8.35763 11.154 7.9673 11.2871 7.51732C11.4043 7.12141 11.4043 6.69501 11.2871 6.2991C11.154 5.84912 10.7985 5.45879 10.0877 4.67826L7.27548 1.59034C6.965 1.24945 6.80979 1.079 6.62867 0.957113C6.46801 0.849042 6.29294 0.769407 6.10978 0.721123C5.90318 0.666664 5.68364 0.666664 5.24464 0.666664ZM3.47234 3.3274C3.47234 3.50883 3.33841 3.65591 3.17317 3.65591C3.00795 3.65591 2.874 3.50883 2.874 3.3274C2.874 3.14598 3.00795 2.9989 3.17317 2.9989C3.33841 2.9989 3.47234 3.14598 3.47234 3.3274Z" stroke="#FFC567" strokeLinecap="round" strokeLinejoin="round" />
//                                     </svg>
//                                     <span>{product.categories}</span>
//                                 </div>
//                                 <div className={styles.type}>
//                                     {product.login_type === "EMAIL_CODE" || product.login_type === "URL_EMAIL" ? (
//                                         <>
//                                             <svg width="13" height="18" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
//                                                 <path d="M1.39653 1.9361C1.26838 1.93086 1.14113 1.95891 1.02814 2.01729C0.915152 2.07567 0.820594 2.16224 0.754397 2.2679C0.261307 3.03061 2.67748e-05 3.91083 0.000122096 4.80895C0.000122096 4.99115 0.0753759 5.16588 0.209329 5.2947C0.343281 5.42353 0.52496 5.49591 0.714398 5.49591C0.903835 5.49591 1.08551 5.42353 1.21947 5.2947C1.35342 5.16588 1.42867 4.99115 1.42867 4.80895C1.42867 4.16734 1.61581 3.53808 1.96795 2.99333C2.0358 2.89158 2.07454 2.77442 2.08025 2.65367C2.08596 2.53293 2.05844 2.41287 2.00048 2.30562C1.94251 2.19837 1.85615 2.10773 1.7501 2.04285C1.64406 1.97797 1.5221 1.94115 1.39653 1.9361Z" fill="#6AEC3D" />
//                                                 <path fillRule="evenodd" clipRule="evenodd" d="M0.702918 4.11238C0.513724 4.11527 0.333454 4.19025 0.201681 4.32084C0.0699071 4.45144 -0.00260161 4.62699 7.13649e-05 4.80895V8.28701C7.13649e-05 8.4692 0.0753252 8.64393 0.209278 8.77276C0.34323 8.90159 0.524909 8.97397 0.714347 8.97397C0.903785 8.97397 1.08546 8.90159 1.21942 8.77276C1.35337 8.64393 1.42862 8.4692 1.42862 8.28701V4.80895C1.42997 4.717 1.41211 4.62573 1.37611 4.54054C1.3401 4.45535 1.28667 4.37798 1.21899 4.31302C1.15131 4.24805 1.07076 4.19682 0.982112 4.16236C0.893464 4.12789 0.798523 4.1109 0.702918 4.11238Z" fill="#6AEC3D" />
//                                                 <path d="M5.00005 2.06113C3.43007 2.06113 2.14294 3.29971 2.14294 4.80895C2.14294 4.99114 2.2182 5.16587 2.35215 5.2947C2.4861 5.42353 2.66778 5.49591 2.85722 5.49591C3.04666 5.49591 3.22834 5.42353 3.36229 5.2947C3.49624 5.16587 3.5715 4.99114 3.5715 4.80895C3.5715 4.04231 4.2022 3.43504 5.00005 3.43504C5.79718 3.43504 6.4286 4.04231 6.4286 4.80895C6.4286 4.99114 6.50385 5.16587 6.6378 5.2947C6.77176 5.42353 6.95344 5.49591 7.14287 5.49591C7.33231 5.49591 7.51399 5.42353 7.64794 5.2947C7.78189 5.16587 7.85715 4.99114 7.85715 4.80895C7.85715 3.29971 6.56931 2.06113 5.00005 2.06113Z" fill="#6AEC3D" />
//                                                 <path fillRule="evenodd" clipRule="evenodd" d="M4.98857 4.11238C4.79937 4.11527 4.6191 4.19025 4.48733 4.32084C4.35556 4.45144 4.28305 4.62699 4.28572 4.80895V8.24373C4.28572 8.24373 4.28501 8.65247 4.38858 9.15052C4.49215 9.64925 4.68357 10.2847 5.20928 10.7903C5.27517 10.8559 5.35399 10.9082 5.44113 10.9442C5.52827 10.9802 5.622 10.9992 5.71684 11C5.81168 11.0008 5.90574 10.9834 5.99352 10.9488C6.0813 10.9143 6.16105 10.8633 6.22812 10.7988C6.29518 10.7343 6.34822 10.6576 6.38413 10.5732C6.42005 10.4887 6.43812 10.3983 6.4373 10.3071C6.43647 10.2159 6.41677 10.1257 6.37933 10.0419C6.3419 9.9581 6.28748 9.88229 6.21926 9.81892C6.02998 9.63757 5.86427 9.24257 5.78927 8.8826C5.71427 8.52195 5.71427 8.24373 5.71427 8.24373V4.80895C5.71562 4.717 5.69776 4.62573 5.66175 4.54054C5.62574 4.45535 5.57232 4.37798 5.50464 4.31302C5.43696 4.24805 5.35641 4.19682 5.26776 4.16236C5.17911 4.12789 5.08417 4.1109 4.98857 4.11238ZM2.84574 4.11238C2.65655 4.11527 2.47628 4.19025 2.3445 4.32084C2.21273 4.45144 2.14022 4.62699 2.14289 4.80895V5.49591C2.14289 5.6781 2.21815 5.85283 2.3521 5.98166C2.48605 6.11049 2.66773 6.18286 2.85717 6.18286C3.04661 6.18286 3.22829 6.11049 3.36224 5.98166C3.49619 5.85283 3.57144 5.6781 3.57144 5.49591V4.80895C3.5728 4.717 3.55494 4.62573 3.51893 4.54054C3.48292 4.45535 3.42949 4.37798 3.36181 4.31302C3.29413 4.24805 3.21358 4.19682 3.12493 4.16236C3.03629 4.12789 2.94135 4.1109 2.84574 4.11238ZM2.84574 6.8602C2.65655 6.8631 2.47628 6.93807 2.3445 7.06867C2.21273 7.19927 2.14022 7.37481 2.14289 7.55678V9.61765C2.14289 9.79984 2.21815 9.97457 2.3521 10.1034C2.48605 10.2322 2.66773 10.3046 2.85717 10.3046C3.04661 10.3046 3.22829 10.2322 3.36224 10.1034C3.49619 9.97457 3.57144 9.79984 3.57144 9.61765V7.55678C3.5728 7.46483 3.55494 7.37355 3.51893 7.28836C3.48292 7.20317 3.42949 7.1258 3.36181 7.06084C3.29413 6.99588 3.21358 6.94465 3.12493 6.91018C3.03629 6.87572 2.94135 6.85872 2.84574 6.8602ZM7.13139 4.11238C6.9422 4.11527 6.76193 4.19025 6.63016 4.32084C6.49838 4.45144 6.42587 4.62699 6.42855 4.80895V8.24373C6.42855 8.24373 6.43498 8.54599 6.55355 8.89016C6.71848 9.34856 6.99185 9.76385 7.35211 10.1033C7.41799 10.1689 7.49681 10.2213 7.58396 10.2573C7.6711 10.2933 7.76483 10.3122 7.85967 10.313C7.95451 10.3138 8.04856 10.2964 8.13635 10.2619C8.22413 10.2273 8.30388 10.1763 8.37094 10.1118C8.43801 10.0473 8.49105 9.97064 8.52696 9.88621C8.56288 9.80179 8.58095 9.71133 8.58012 9.62012C8.5793 9.5289 8.5596 9.43876 8.52216 9.35495C8.48473 9.27114 8.43031 9.19534 8.36209 9.13197C8.08852 8.86955 7.96924 8.62637 7.90995 8.456C7.84996 8.28495 7.8571 8.24373 7.8571 8.24373V4.80895C7.85845 4.717 7.84059 4.62573 7.80458 4.54054C7.76857 4.45535 7.71514 4.37798 7.64747 4.31302C7.57979 4.24805 7.49924 4.19682 7.41059 4.16236C7.32194 4.12789 7.227 4.1109 7.13139 4.11238ZM9.27422 4.11238C9.08503 4.11527 8.90476 4.19025 8.77298 4.32084C8.64121 4.45144 8.5687 4.62699 8.57137 4.80895V5.49591C8.57137 5.6781 8.64663 5.85283 8.78058 5.98166C8.91453 6.11049 9.09621 6.18286 9.28565 6.18286C9.47509 6.18286 9.65677 6.11049 9.79072 5.98166C9.92467 5.85283 9.99992 5.6781 9.99992 5.49591V4.80895C10.0013 4.717 9.98342 4.62573 9.94741 4.54054C9.9114 4.45535 9.85797 4.37798 9.79029 4.31302C9.72261 4.24805 9.64206 4.19682 9.55341 4.16236C9.46477 4.12789 9.36983 4.1109 9.27422 4.11238Z" fill="#6AEC3D" />
//                                                 <path d="M5.05142 0.000258414C4.17972 -0.0084347 3.32083 0.20234 2.56003 0.61165C2.47809 0.655583 2.40596 0.714607 2.34774 0.785352C2.28953 0.856097 2.24637 0.937177 2.22073 1.02396C2.1951 1.11075 2.18749 1.20154 2.19834 1.29116C2.20918 1.38077 2.23828 1.46745 2.28396 1.54625C2.32964 1.62505 2.39101 1.69443 2.46457 1.75042C2.53813 1.80641 2.62243 1.84792 2.71267 1.87257C2.80291 1.89723 2.89731 1.90454 2.99049 1.89411C3.08367 1.88368 3.1738 1.8557 3.25573 1.81176C3.79913 1.51912 4.4127 1.36832 5.03546 1.37435C5.65822 1.38037 6.26851 1.54301 6.80568 1.84611C7.34328 2.14879 7.78913 2.58153 8.09889 3.10132C8.40866 3.62111 8.57155 4.20984 8.57137 4.80895C8.57137 4.99114 8.64662 5.16587 8.78058 5.2947C8.91453 5.42353 9.09621 5.49591 9.28565 5.49591C9.47508 5.49591 9.65676 5.42353 9.79071 5.2947C9.92467 5.16587 9.99992 4.99114 9.99992 4.80895C9.99951 3.97031 9.77124 3.14633 9.33775 2.41866C8.90425 1.69099 8.28058 1.08489 7.52853 0.660423C6.77705 0.236421 5.92334 0.00883358 5.05213 0.000258414H5.05142Z" fill="#6AEC3D" />
//                                                 <path d="M9.99996 7.55678C9.99996 7.73897 9.92471 7.9137 9.79076 8.04253C9.6568 8.17136 9.47512 8.24373 9.28569 8.24373C9.09625 8.24373 8.91457 8.17136 8.78062 8.04253C8.64667 7.9137 8.57141 7.73897 8.57141 7.55678C8.57141 7.37458 8.64667 7.19985 8.78062 7.07102C8.91457 6.9422 9.09625 6.86982 9.28569 6.86982C9.47512 6.86982 9.6568 6.9422 9.79076 7.07102C9.92471 7.19985 9.99996 7.37458 9.99996 7.55678Z" fill="#6AEC3D" />
//                                             </svg>
//                                             <span>С входом</span>
//                                         </>
//                                     ) : (
//                                         <>
//                                             <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
//                                                 <path d="M5.5 2.375H2.5C1.67157 2.375 1 2.99061 1 3.75V10.625C1 11.3844 1.67157 12 2.5 12H10C10.8284 12 11.5 11.3844 11.5 10.625V7.875M8.5 1H13M13 1V5.125M13 1L5.5 7.875" stroke="#FDB834" strokeLinecap="round" strokeLinejoin="round" />
//                                             </svg>
//                                             <span>Без входа</span>
//                                         </>
//                                     )}
//                                 </div>
//                             </div>
//                             <div className={styles.content}>
//                                 <div className={styles.img}>
//                                     <Image 
//                                         src={product.images[0].original}
//                                         alt={product.title}
//                                         fill
//                                         sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
//                                         className="object-contain"
//                                         priority={isLastViewed} // Приоритетная загрузка для последнего просмотренного товара
//                                     />
//                                 </div>
//                                 <div className={styles.container}>
//                                     <div className={styles.name}>
//                                         <h3>{product.title}</h3>
//                                     </div>
//                                     <div className={styles.actions}>
//                                         <p className={styles.price}>{product.price.incl_tax} ₽</p>
//                                         <div className={styles.cart_action}>
//                                             {isLoading ? (
//                                                 <Shimmer width={120} height={31}
//                                                          className={`${shimmer.shimmer_btn} shimmer`}/>
//                                             ) : count < 1 ? (
//                                                 <ButtonAdd id={product.id} game={product.game}/>
//                                             ) : (
//                                                 <ActionButtons id={product.id} count={count} game={product.game}/>
//                                             )}
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                         </Link>
//                     )
//                 })}
//             </div>
//         </div>
//     )
// }


'use client'
import styles from "./products.module.scss"
import CatalogMenu from "@/components/catalog/menu/menu";
import {IProduct} from "@/types/products.interface";
import Link from "next/link";
import Image from "next/image";
import {Shimmer} from "react-shimmer";
import shimmer from "@/components/ui/shimmer/shimmer.module.scss";
import ButtonAdd from "@/components/ui/button-add/button";
import ActionButtons from "@/components/ui/action-buttons/action-buttons";
import {useEffect, useState, useRef} from "react";
import {useCart} from "@/components/store/store";
import {CartItem} from "@/types/store.interface";
import {useLastViewedStore} from "@/components/store/lastViewedStore";
import Filters from "../Filters/Filters";

interface Filters {
    newAccount: boolean;
    promotions: boolean;
    passes: boolean;
    gems: boolean;
}

// Ключ для хранения фильтров в localStorage

export default function Products(props: { data: IProduct[] }) {
    const { items } = useCart();
    const [clientItems, setClientItems] = useState<CartItem[]>([]);
    const { lastViewedProductId, setLastViewedProduct, clearLastViewedProduct } = useLastViewedStore();
    const [isLoading, setLoading] = useState(true);
    const [filteredProducts, setFilteredProducts] = useState<IProduct[]>(props.data);
    const [activeFilters, setActiveFilters] = useState<Filters>({
        newAccount: false,
        promotions: false,
        passes: false,
        gems: false
    });
    
    // Используем ref для хранения ссылок на элементы товаров
    const productRefs = useRef<Record<number, HTMLElement | null>>({});
    
    // Обновление товаров корзины при их изменении
    useEffect(() => {
        setClientItems(items);
    }, [items]);

   // Функция для применения фильтров
   const applyFilters = (products: IProduct[], filters: Filters) => {
    // Если все фильтры отключены - возвращаем все товары
    if (!filters.newAccount && !filters.promotions && !filters.passes && !filters.gems) {
        return products;
    } else {
        // Иначе фильтруем по активным фильтрам
        return products.filter(product => {
            // Если хотя бы один фильтр активен, проверяем соответствие
            return (
                (!filters.newAccount || product.filters_type === "NEW_ACCOUNT") &&
                (!filters.promotions || product.filters_type === "PROMO") &&
                (!filters.passes || product.filters_type === "PASS") && 
                (!filters.gems || product.filters_type === "GEMS")
            );
        });
    }
};

useEffect(() => {
    // Имитируем загрузку для скелетонов
    setLoading(true);
    
    try {
        // Устанавливаем все продукты без фильтрации при первой загрузке
        setFilteredProducts(props.data);
        
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        setFilteredProducts(props.data);
    }
    
    // Небольшая задержка для отображения скелетонов
    const timeoutId = setTimeout(() => {
        setLoading(false);
    }, 400);
    
    return () => clearTimeout(timeoutId);
}, [props.data]);

const handleFilterChange = (filters: Filters) => {
    setActiveFilters(filters);
    
    try {
        // Кратковременно показываем скелетоны при изменении фильтров
        setLoading(true);
        
        // Применяем фильтры к данным с сервера
        const filtered = applyFilters(props.data, filters);
        setFilteredProducts(filtered);
        
        // Отключаем скелетоны через небольшую задержку
        setTimeout(() => {
            setLoading(false);
        }, 200);
    } catch (error) {
        console.error('Ошибка при применении фильтров:', error);
        setLoading(false);
    }
};

    // Прокрутка к последнему просмотренному товару
    useEffect(() => {
        if (!lastViewedProductId) return;
        
        let scrollAttempts = 0;
        const maxScrollAttempts = 10;
        
        const tryScrollToProduct = () => {
            const element = productRefs.current[lastViewedProductId];
            scrollAttempts++;
            
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({
                        behavior: 'auto', 
                        block: 'center'
                    });
                    clearLastViewedProduct();
                }, 100);
                
                return true;
            }
            
            if (scrollAttempts >= maxScrollAttempts) {
                clearLastViewedProduct();
                return true;
            }
            
            return false;
        };
        
        const scrollInterval = setInterval(() => {
            if (tryScrollToProduct()) {
                clearInterval(scrollInterval);
            }
        }, 100);
        
        return () => {
            clearInterval(scrollInterval);
        };
    }, [lastViewedProductId, clearLastViewedProduct]);

    // Функция для сохранения ссылки на элемент товара
    const setProductRef = (id: number, element: HTMLElement | null): void => {
        productRefs.current[id] = element;
    };

    // Обработчик клика по товару - сохраняем его ID
    const handleProductClick = (id: number): void => {
        setLastViewedProduct(id);
    };

    return (
        <div className={styles.products}>
            <CatalogMenu/>
            <Filters onFilterChange={handleFilterChange} />
            <div className={styles.items}>
                {filteredProducts.map((product: IProduct) => {
                    const cartItem = clientItems.find((i) => i.id === product.id)
                    const count = cartItem ? cartItem.count : 0
                    const isLastViewed = product.id === lastViewedProductId;

                    return (
                        <Link 
                            href={`/product/${product.id}`} 
                            key={product.id} 
                            className={`${styles.item} ${isLastViewed ? styles.lastViewed : ''}`}
                            onClick={() => handleProductClick(product.id)}
                            ref={(el) => setProductRef(product.id, el)}
                        >
                            <div className={styles.types}>
                                <div className={styles.type}>
                                    <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3.17317 3.3274H3.17916M5.24464 0.666664H3.62205C2.61674 0.666664 2.11408 0.666664 1.73011 0.881492C1.39235 1.07046 1.11774 1.37199 0.945647 1.74286C0.75 2.16448 0.75 2.71641 0.75 3.82029V5.60195C0.75 6.084 0.75 6.32505 0.799597 6.55192C0.843569 6.75303 0.916094 6.94527 1.01452 7.12167C1.12552 7.32055 1.28075 7.49097 1.59121 7.83189L4.40342 10.9198C5.11426 11.7003 5.46974 12.0907 5.87954 12.2369C6.2401 12.3655 6.62843 12.3655 6.98899 12.2369C7.3988 12.0907 7.75427 11.7003 8.4651 10.9198L10.0877 9.13815C10.7985 8.35763 11.154 7.9673 11.2871 7.51732C11.4043 7.12141 11.4043 6.69501 11.2871 6.2991C11.154 5.84912 10.7985 5.45879 10.0877 4.67826L7.27548 1.59034C6.965 1.24945 6.80979 1.079 6.62867 0.957113C6.46801 0.849042 6.29294 0.769407 6.10978 0.721123C5.90318 0.666664 5.68364 0.666664 5.24464 0.666664ZM3.47234 3.3274C3.47234 3.50883 3.33841 3.65591 3.17317 3.65591C3.00795 3.65591 2.874 3.50883 2.874 3.3274C2.874 3.14598 3.00795 2.9989 3.17317 2.9989C3.33841 2.9989 3.47234 3.14598 3.47234 3.3274Z" stroke="#FFC567" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span>{product.categories}</span>
                                </div>
                                <div className={styles.type}>
                                    {product.login_type === "EMAIL_CODE" || product.login_type === "URL_EMAIL" ? (
                                        <>
                                            <svg width="13" height="18" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M1.39653 1.9361C1.26838 1.93086 1.14113 1.95891 1.02814 2.01729C0.915152 2.07567 0.820594 2.16224 0.754397 2.2679C0.261307 3.03061 2.67748e-05 3.91083 0.000122096 4.80895C0.000122096 4.99115 0.0753759 5.16588 0.209329 5.2947C0.343281 5.42353 0.52496 5.49591 0.714398 5.49591C0.903835 5.49591 1.08551 5.42353 1.21947 5.2947C1.35342 5.16588 1.42867 4.99115 1.42867 4.80895C1.42867 4.16734 1.61581 3.53808 1.96795 2.99333C2.0358 2.89158 2.07454 2.77442 2.08025 2.65367C2.08596 2.53293 2.05844 2.41287 2.00048 2.30562C1.94251 2.19837 1.85615 2.10773 1.7501 2.04285C1.64406 1.97797 1.5221 1.94115 1.39653 1.9361Z" fill="#6AEC3D" />
                                                <path fillRule="evenodd" clipRule="evenodd" d="M0.702918 4.11238C0.513724 4.11527 0.333454 4.19025 0.201681 4.32084C0.0699071 4.45144 -0.00260161 4.62699 7.13649e-05 4.80895V8.28701C7.13649e-05 8.4692 0.0753252 8.64393 0.209278 8.77276C0.34323 8.90159 0.524909 8.97397 0.714347 8.97397C0.903785 8.97397 1.08546 8.90159 1.21942 8.77276C1.35337 8.64393 1.42862 8.4692 1.42862 8.28701V4.80895C1.42997 4.717 1.41211 4.62573 1.37611 4.54054C1.3401 4.45535 1.28667 4.37798 1.21899 4.31302C1.15131 4.24805 1.07076 4.19682 0.982112 4.16236C0.893464 4.12789 0.798523 4.1109 0.702918 4.11238Z" fill="#6AEC3D" />
                                                <path d="M5.00005 2.06113C3.43007 2.06113 2.14294 3.29971 2.14294 4.80895C2.14294 4.99114 2.2182 5.16587 2.35215 5.2947C2.4861 5.42353 2.66778 5.49591 2.85722 5.49591C3.04666 5.49591 3.22834 5.42353 3.36229 5.2947C3.49624 5.16587 3.5715 4.99114 3.5715 4.80895C3.5715 4.04231 4.2022 3.43504 5.00005 3.43504C5.79718 3.43504 6.4286 4.04231 6.4286 4.80895C6.4286 4.99114 6.50385 5.16587 6.6378 5.2947C6.77176 5.42353 6.95344 5.49591 7.14287 5.49591C7.33231 5.49591 7.51399 5.42353 7.64794 5.2947C7.78189 5.16587 7.85715 4.99114 7.85715 4.80895C7.85715 3.29971 6.56931 2.06113 5.00005 2.06113Z" fill="#6AEC3D" />
                                                <path fillRule="evenodd" clipRule="evenodd" d="M4.98857 4.11238C4.79937 4.11527 4.6191 4.19025 4.48733 4.32084C4.35556 4.45144 4.28305 4.62699 4.28572 4.80895V8.24373C4.28572 8.24373 4.28501 8.65247 4.38858 9.15052C4.49215 9.64925 4.68357 10.2847 5.20928 10.7903C5.27517 10.8559 5.35399 10.9082 5.44113 10.9442C5.52827 10.9802 5.622 10.9992 5.71684 11C5.81168 11.0008 5.90574 10.9834 5.99352 10.9488C6.0813 10.9143 6.16105 10.8633 6.22812 10.7988C6.29518 10.7343 6.34822 10.6576 6.38413 10.5732C6.42005 10.4887 6.43812 10.3983 6.4373 10.3071C6.43647 10.2159 6.41677 10.1257 6.37933 10.0419C6.3419 9.9581 6.28748 9.88229 6.21926 9.81892C6.02998 9.63757 5.86427 9.24257 5.78927 8.8826C5.71427 8.52195 5.71427 8.24373 5.71427 8.24373V4.80895C5.71562 4.717 5.69776 4.62573 5.66175 4.54054C5.62574 4.45535 5.57232 4.37798 5.50464 4.31302C5.43696 4.24805 5.35641 4.19682 5.26776 4.16236C5.17911 4.12789 5.08417 4.1109 4.98857 4.11238ZM2.84574 4.11238C2.65655 4.11527 2.47628 4.19025 2.3445 4.32084C2.21273 4.45144 2.14022 4.62699 2.14289 4.80895V5.49591C2.14289 5.6781 2.21815 5.85283 2.3521 5.98166C2.48605 6.11049 2.66773 6.18286 2.85717 6.18286C3.04661 6.18286 3.22829 6.11049 3.36224 5.98166C3.49619 5.85283 3.57144 5.6781 3.57144 5.49591V4.80895C3.5728 4.717 3.55494 4.62573 3.51893 4.54054C3.48292 4.45535 3.42949 4.37798 3.36181 4.31302C3.29413 4.24805 3.21358 4.19682 3.12493 4.16236C3.03629 4.12789 2.94135 4.1109 2.84574 4.11238ZM2.84574 6.8602C2.65655 6.8631 2.47628 6.93807 2.3445 7.06867C2.21273 7.19927 2.14022 7.37481 2.14289 7.55678V9.61765C2.14289 9.79984 2.21815 9.97457 2.3521 10.1034C2.48605 10.2322 2.66773 10.3046 2.85717 10.3046C3.04661 10.3046 3.22829 10.2322 3.36224 10.1034C3.49619 9.97457 3.57144 9.79984 3.57144 9.61765V7.55678C3.5728 7.46483 3.55494 7.37355 3.51893 7.28836C3.48292 7.20317 3.42949 7.1258 3.36181 7.06084C3.29413 6.99588 3.21358 6.94465 3.12493 6.91018C3.03629 6.87572 2.94135 6.85872 2.84574 6.8602ZM7.13139 4.11238C6.9422 4.11527 6.76193 4.19025 6.63016 4.32084C6.49838 4.45144 6.42587 4.62699 6.42855 4.80895V8.24373C6.42855 8.24373 6.43498 8.54599 6.55355 8.89016C6.71848 9.34856 6.99185 9.76385 7.35211 10.1033C7.41799 10.1689 7.49681 10.2213 7.58396 10.2573C7.6711 10.2933 7.76483 10.3122 7.85967 10.313C7.95451 10.3138 8.04856 10.2964 8.13635 10.2619C8.22413 10.2273 8.30388 10.1763 8.37094 10.1118C8.43801 10.0473 8.49105 9.97064 8.52696 9.88621C8.56288 9.80179 8.58095 9.71133 8.58012 9.62012C8.5793 9.5289 8.5596 9.43876 8.52216 9.35495C8.48473 9.27114 8.43031 9.19534 8.36209 9.13197C8.08852 8.86955 7.96924 8.62637 7.90995 8.456C7.84996 8.28495 7.8571 8.24373 7.8571 8.24373V4.80895C7.85845 4.717 7.84059 4.62573 7.80458 4.54054C7.76857 4.45535 7.71514 4.37798 7.64747 4.31302C7.57979 4.24805 7.49924 4.19682 7.41059 4.16236C7.32194 4.12789 7.227 4.1109 7.13139 4.11238ZM9.27422 4.11238C9.08503 4.11527 8.90476 4.19025 8.77298 4.32084C8.64121 4.45144 8.5687 4.62699 8.57137 4.80895V5.49591C8.57137 5.6781 8.64663 5.85283 8.78058 5.98166C8.91453 6.11049 9.09621 6.18286 9.28565 6.18286C9.47509 6.18286 9.65677 6.11049 9.79072 5.98166C9.92467 5.85283 9.99992 5.6781 9.99992 5.49591V4.80895C10.0013 4.717 9.98342 4.62573 9.94741 4.54054C9.9114 4.45535 9.85797 4.37798 9.79029 4.31302C9.72261 4.24805 9.64206 4.19682 9.55341 4.16236C9.46477 4.12789 9.36983 4.1109 9.27422 4.11238Z" fill="#6AEC3D" />
                                                <path d="M5.05142 0.000258414C4.17972 -0.0084347 3.32083 0.20234 2.56003 0.61165C2.47809 0.655583 2.40596 0.714607 2.34774 0.785352C2.28953 0.856097 2.24637 0.937177 2.22073 1.02396C2.1951 1.11075 2.18749 1.20154 2.19834 1.29116C2.20918 1.38077 2.23828 1.46745 2.28396 1.54625C2.32964 1.62505 2.39101 1.69443 2.46457 1.75042C2.53813 1.80641 2.62243 1.84792 2.71267 1.87257C2.80291 1.89723 2.89731 1.90454 2.99049 1.89411C3.08367 1.88368 3.1738 1.8557 3.25573 1.81176C3.79913 1.51912 4.4127 1.36832 5.03546 1.37435C5.65822 1.38037 6.26851 1.54301 6.80568 1.84611C7.34328 2.14879 7.78913 2.58153 8.09889 3.10132C8.40866 3.62111 8.57155 4.20984 8.57137 4.80895C8.57137 4.99114 8.64662 5.16587 8.78058 5.2947C8.91453 5.42353 9.09621 5.49591 9.28565 5.49591C9.47508 5.49591 9.65676 5.42353 9.79071 5.2947C9.92467 5.16587 9.99992 4.99114 9.99992 4.80895C9.99951 3.97031 9.77124 3.14633 9.33775 2.41866C8.90425 1.69099 8.28058 1.08489 7.52853 0.660423C6.77705 0.236421 5.92334 0.00883358 5.05213 0.000258414H5.05142Z" fill="#6AEC3D" />
                                                <path d="M9.99996 7.55678C9.99996 7.73897 9.92471 7.9137 9.79076 8.04253C9.6568 8.17136 9.47512 8.24373 9.28569 8.24373C9.09625 8.24373 8.91457 8.17136 8.78062 8.04253C8.64667 7.9137 8.57141 7.73897 8.57141 7.55678C8.57141 7.37458 8.64667 7.19985 8.78062 7.07102C8.91457 6.9422 9.09625 6.86982 9.28569 6.86982C9.47512 6.86982 9.6568 6.9422 9.79076 7.07102C9.92471 7.19985 9.99996 7.37458 9.99996 7.55678Z" fill="#6AEC3D" />
                                            </svg>
                                            <span>С входом</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M5.5 2.375H2.5C1.67157 2.375 1 2.99061 1 3.75V10.625C1 11.3844 1.67157 12 2.5 12H10C10.8284 12 11.5 11.3844 11.5 10.625V7.875M8.5 1H13M13 1V5.125M13 1L5.5 7.875" stroke="#FDB834" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <span>Без входа</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className={styles.content}>
                                <div className={styles.img}>
                                    <Image 
                                        src={product.images[0].original}
                                        alt={product.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-contain"
                                        priority={isLastViewed} // Приоритетная загрузка для последнего просмотренного товара
                                    />
                                </div>
                                <div className={styles.container}>
                                    <div className={styles.name}>
                                        <h3>{product.title}</h3>
                                    </div>
                                    <div className={styles.actions}>
                                        <p className={styles.price}>{product.price.incl_tax} ₽</p>
                                        <div className={styles.cart_action}>
                                            {isLoading ? (
                                                <Shimmer width={120} height={31}
                                                         className={`${shimmer.shimmer_btn} shimmer`}/>
                                            ) : count < 1 ? (
                                                <ButtonAdd id={product.id} game={product.game} loginType={product.login_type} />

                                            ) : (
                                                <ActionButtons id={product.id} count={count} game={product.game} loginType={product.login_type} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}