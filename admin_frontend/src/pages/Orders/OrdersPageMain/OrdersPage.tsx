import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import style from "./OrdersPage.module.css";
import TablePage from "../../../components/TablePage/TablePage";
import { davDamerAPI } from "../../../store/api/DavdamerAPI";
import { IParamsAPI } from "../../../store/api/DavdamerAPI";
import { statusOrder, IOrder } from "../../../models/type";
import { useLanguage } from "../../../context/LanguageContext";
import NotificationToast from '../../../components/NotificationToast/NotificationToast';
import { 
    findNewOrders, 
    saveProcessedOrderIds,
    hasStatusChangedToPaid, 
    saveOrderStatus, 
  } from '../../../utils/localStorage';

import notificationSound from './sound.mp3';

interface SearchParams {
    type: 'number' | 'telegram_id';
    query: string;
}

export const OrderSearch = ({ onSearch }: { 
    onSearch: (params: SearchParams) => void 
}) => {
    const { translations, language } = useLanguage();
    const t = translations.table.orders;

    const [searchType, setSearchType] = useState<'number' | 'telegram_id'>('number');
    const [searchValue, setSearchValue] = useState('');

    const handleSearch = (value: string) => {
        setSearchValue(value);
        onSearch({
            type: searchType,
            query: value
        });
    };

    return (
        <div className={style.orderSearch}>
            <select 
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'number' | 'telegram_id')}
                className={style.orderSearch__select}
            >
                <option value="number">{t.columns.orderNumber[language]}</option>
                <option value="telegram_id">{t.columns.clientId[language]}</option>
            </select>
            <input
                type="text"
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={`${t.search?.placeholder?.[language] || 'Поиск...'}`}
                className={style.orderSearch__input}
            />
        </div>
    );
};

function OrdersPage() {
    // State for API parameters
    const [paramsAPI, setParamsAPI] = useState<IParamsAPI>({
        status: 'PAID' // Default to show only PAID orders
    });
    
    // State for search
    const [searchParams, setSearchParams] = useState<SearchParams>({
        type: 'number',
        query: ''
    });
    
    // State for order data
    const [orders, setOrders] = useState<IOrder[]>([]);
    
    // State for notifications
    const [notification, setNotification] = useState<{message: string, type?: 'info' | 'success' | 'warning' | 'error'} | null>(null);
    
    // Reference for tracking previous order count and audio
    // const previousOrdersCount = useRef<number>(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    // Track if we're performing initial load
    const initialLoadDone = useRef<boolean>(false);
    
    // Use the API hook
    const { data, error, isLoading, refetch } = davDamerAPI.useFetchAllOrdersQuery(paramsAPI);

    // Initialize audio on component mount
    useEffect(() => {
        audioRef.current = new Audio(notificationSound);
        return () => {
            if (audioRef.current) {
                audioRef.current = null;
            }
        };
    }, []);


    const processOrders = useCallback((ordersData: IOrder[]) => {
        if (!ordersData) return [];
        
        // Помечаем заказы как измененные только на основе email_changed и code_changed
        return ordersData.map(order => ({
          ...order,
          has_changed_login_data: order.lines?.some((line: { login_data: { email_changed: any; code_changed: any; }; }) => 
            line.login_data?.email_changed || line.login_data?.code_changed
          ) || false
        }));
      }, []);
    // Set up polling interval for fetching new data
    useEffect(() => {
        const interval = setInterval(() => {
            refetch();
        }, 3000); // Poll every 10 seconds
        
        return () => clearInterval(interval);
    }, [refetch]);

    useEffect(() => {
        const handleStorageChange = () => {
            // Перезагрузить данные при изменении localStorage
            refetch();
        };
        
        window.addEventListener('storage-changed', handleStorageChange);
        return () => {
            window.removeEventListener('storage-changed', handleStorageChange);
        };
    }, [refetch]);



    useEffect(() => {
        if (data) {
            // Находим только действительно новые заказы (которых нет в localStorage)
            const newOrders = findNewOrders(data);
            
            // Находим заказы, статус которых изменился на PAID
            const statusChangedToPaidOrders = data.filter(order => 
                hasStatusChangedToPaid(order.id, order.status)
            );
            
            let shouldPlaySound = false;
            
            // Показываем уведомление о новых заказах
            if (newOrders.length > 0) {
                shouldPlaySound = true;
                
                setNotification({
                    message: `Получено новых заказов: ${newOrders.length}`,
                    type: 'success'
                });
                
                // Сохраняем ID новых заказов
                saveProcessedOrderIds(newOrders.map(order => order.id));
            }
            
            // Показываем уведомление об изменениях статуса
            if (statusChangedToPaidOrders.length > 0 && !newOrders.some(o => statusChangedToPaidOrders.includes(o))) {
                shouldPlaySound = true;
                
                setNotification({
                    message: `${statusChangedToPaidOrders.length} заказ(ов) изменили статус на "Оплачен"`,
                    type: 'warning'
                });
            }
            
            // Воспроизводим звук при необходимости
            if (shouldPlaySound && audioRef.current) {
                audioRef.current.play().catch(e => 
                    console.log('Audio playback error:', e)
                );
            }
            
            // Сохраняем статусы всех заказов для будущего отслеживания
            data.forEach(order => saveOrderStatus(order.id, order.status));
            
            // Mark initial load as done
            if (!initialLoadDone.current) {
                initialLoadDone.current = true;
            }
            
            // Process orders and set to state
            const processedOrders = processOrders(data);
            setOrders(processedOrders);
        }
    }, [data, processOrders]);

// Добавьте новый useEffect для периодического обновления деталей заказов PAID
useEffect(() => {
    // Функция для запроса деталей заказов со статусом PAID
    const fetchPaidOrdersDetails = async () => {
      if (orders && orders.length > 0) {
        const paidOrders = orders.filter(order => order.status === 'PAID');
        
        for (const order of paidOrders) {
          try {
            const detailsResponse = await fetch(`https://api.mamostore.ru/api/davdamer/order/${order.id}/`);
            const orderDetails = await detailsResponse.json();
            
            // Проверяем, есть ли измененные данные
            const hasChanges = orderDetails.lines?.some((line: { login_data: { email_changed: any; code_changed: any; }; }) => 
              line.login_data?.email_changed || line.login_data?.code_changed
            );
            
            if (hasChanges) {
              // Проверяем, было ли это изменение уже обработано
              const isNewChange = !orders.find(o => 
                o.id === order.id && o.has_changed_login_data
              );
              
              if (isNewChange) {
                setNotification({
                  message: `Данные заказа #${order.number} были изменены`,
                  type: 'info'
                });
                
                if (audioRef.current) {
                  audioRef.current.play().catch(e => console.log('Audio playback error:', e));
                }
              }
              
              // Обновляем состояние заказов
              setOrders(prev => prev.map(o => 
                o.id === order.id ? { ...o, has_changed_login_data: true } : o
              ));
            }
          } catch (error) {
            console.error(`Ошибка при получении деталей заказа ${order.id}:`, error);
          }
        }
      }
    };
  
    // Вызываем сразу и устанавливаем интервал
    fetchPaidOrdersDetails();
    
    const detailsInterval = setInterval(fetchPaidOrdersDetails, 5000); // Каждые 5 секунд
    
    return () => clearInterval(detailsInterval);
  }, [orders]); // Зависимость от orders, чтобы реагировать на их изменения



  
    // Filter orders based on search parameters
    const filteredOrders = useMemo(() => {
        if (!orders || !searchParams.query) return orders;
    
        return orders.filter((order: IOrder) => {
            const query = searchParams.query.toLowerCase();
            
            if (searchParams.type === 'number') {
                return order.number.toLowerCase().includes(query);
            }
            
            if (searchParams.type === 'telegram_id') {
                // Handle Telegram ID search - extract ID from username if it has "TG:" prefix
                const userIdStr = order.user.username ? order.user.username.toString() : '';
                const cleanUserId = userIdStr.replace('TG:', '');
                return cleanUserId.includes(query);
            }
            
            return false;
        });
    }, [orders, searchParams]);

    // Handle filter parameter changes
    const setParamsFilter = (key: string, value: string | number) => {
        setParamsAPI((prevParams) => {
            const obj = { ...prevParams };

            if (key === "statusName") {
                if (value === "") {
                    // If filter is reset, set status to PAID (default)
                    obj["status"] = "PAID";
                } else {
                    // Find the status code from the status name
                    const objStatus = Object.entries(statusOrder);
                    let status = "";
                    objStatus.forEach((item) => {
                        if (item[1] === value) {
                            status = item[0];
                            return;
                        }
                    });
                    obj["status"] = status.toUpperCase();
                }
            } else {
                obj[key] = value;
            }
            return obj;
        });
    };



    if (isLoading) return (<p>Загрузка данных</p>);
    if (error) return (<p>Ошибка</p>);

    return (
        <>
            {notification && (
                <NotificationToast 
                    message={notification.message}
                    type={notification.type || 'info'}
                    onClose={() => setNotification(null)}
                />
            )}
            {filteredOrders && (
                <TablePage 
                    setParamsFilter={setParamsFilter} 
                    style={style} 
                    nameTable="orders" 
                    orders={filteredOrders} 
                    lengthRow={filteredOrders.length}
                    onSearch={setSearchParams}
                />
            )}
        </>
    );
}

export default OrdersPage;