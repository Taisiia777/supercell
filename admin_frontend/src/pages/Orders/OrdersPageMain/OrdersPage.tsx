
import { useState, useMemo, useEffect, useRef  } from "react";
import style from "./OrdersPage.module.css";
import TablePage from "../../../components/TablePage/TablePage";
import { davDamerAPI } from "../../../store/api/DavdamerAPI";
import { IParamsAPI } from "../../../store/api/DavdamerAPI";
import { statusOrder, IOrder } from "../../../models/type";
import { useLanguage } from "../../../context/LanguageContext";
import NotificationToast from '../../../components/NotificationToast/NotificationToast';
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
    const [paramsAPI, setParamsAPI] = useState<IParamsAPI>({
        status: 'PAID'
    });
    const [searchParams, setSearchParams] = useState<SearchParams>({
        type: 'number',
        query: ''
    });
    const [orders, setOrders] = useState<IOrder[]>([]);
    const [notification, setNotification] = useState<{message: string} | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const previousOrdersCount = useRef<number>(0);
    
    const { data, error, isLoading, refetch } = davDamerAPI.useFetchAllOrdersQuery(paramsAPI);

    useEffect(() => {
        audioRef.current = new Audio(notificationSound);
        return () => {
            if (audioRef.current) {
                audioRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            refetch();
        }, 5000);
        return () => clearInterval(interval);
    }, [refetch]);

    useEffect(() => {
        if (data) {
            if (previousOrdersCount.current && data.length > previousOrdersCount.current) {
                const newOrders = data.length - previousOrdersCount.current;
                
                if (audioRef.current) {
                    audioRef.current.play().catch(e => 
                        console.log('Ошибка воспроизведения звука:', e)
                    );
                }
                
                setNotification({
                    message: `Получено новых заказов: ${newOrders}`
                });
            }
            previousOrdersCount.current = data.length;
            setOrders(data);
        }
    }, [data]);

    const filteredOrders = useMemo(() => {
        if (!orders || !searchParams.query) return orders;
    
        return orders.filter((order: IOrder) => {
            const query = searchParams.query.toLowerCase();
            
            if (searchParams.type === 'number') {
                return order.number.toLowerCase().includes(query);
            }
            
            if (searchParams.type === 'telegram_id') {
                const userIdStr = order.user.username.toString();
                const cleanUserId = userIdStr.replace('TG:', '');
                return cleanUserId.includes(query);
            }
            
            return false;
        });
    }, [orders, searchParams]);

    const setParamsFilter = (key: string, value: string | number) => {
        setParamsAPI((prevParams) => {
            const obj = { ...prevParams };

            if (key === "statusName") {
                if (value === "") {
                    // Если фильтр сброшен, устанавливаем статус PAID
                    obj["status"] = "PAID";
                } else {
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



// function OrdersPage() {
//     // const [paramsAPI, setParamsAPI] = useState<IParamsAPI>({});
//     const [paramsAPI, setParamsAPI] = useState<IParamsAPI>({
//         status: 'PAID'
//     });
//     const [searchParams, setSearchParams] = useState<SearchParams>({
//         type: 'number',
//         query: ''
//     });
//     const [orders, setOrders] = useState<IOrder[]>([]);
//     const [notification, setNotification] = useState<{message: string} | null>(null);
//     const audioRef = useRef<HTMLAudioElement | null>(null);
//     const previousOrdersCount = useRef<number>(0);
    
//     const { data, error, isLoading, refetch } = davDamerAPI.useFetchAllOrdersQuery(paramsAPI);

//     useEffect(() => {
//         // Создаем элемент audio при монтировании
//         audioRef.current = new Audio(notificationSound);
        
//         return () => {
//             if (audioRef.current) {
//                 audioRef.current = null;
//             }
//         };
//     }, []);

//     useEffect(() => {
//         const interval = setInterval(() => {
//             refetch();
//         }, 5000); // Проверка каждые 10 секунд

//         return () => clearInterval(interval);
//     }, [refetch]);

//     useEffect(() => {
//         if (data) {
//             // Проверяем, появились ли новые заказы
//             if (previousOrdersCount.current && data.length > previousOrdersCount.current) {
//                 const newOrders = data.length - previousOrdersCount.current;
                
//                 // Воспроизводим звук
//                 if (audioRef.current) {
//                     audioRef.current.play().catch(e => 
//                         console.log('Ошибка воспроизведения звука:', e)
//                     );
//                 }
                
//                 // Показываем уведомление
//                 setNotification({
//                     message: `Получено новых заказов: ${newOrders}`
//                 });
//             }
            
//             previousOrdersCount.current = data.length;
//             setOrders(data);
//         }
//     }, [data]);

//     useEffect(() => {
//         if (data) {
//             setOrders(data);
//         }
//     }, [data]);

//     const filteredOrders = useMemo(() => {
//         if (!orders || !searchParams.query) return orders;
    
//         return orders.filter((order: IOrder) => {
//             const query = searchParams.query.toLowerCase();
            
//             if (searchParams.type === 'number') {
//                 return order.number.toLowerCase().includes(query);
//             }
            
//             if (searchParams.type === 'telegram_id') {
//                 const userIdStr = order.user.username.toString();
//                 const cleanUserId = userIdStr.replace('TG:', '');
                
//                 return cleanUserId.includes(query);
//             }
            
//             return false;
//         });
//     }, [orders, searchParams]);

//     // const setParamsFilter = (key: string, value: string | number) => {
//     //     setParamsAPI(() => {
//     //         const obj = Object.assign({}, paramsAPI);

//     //         if (key === "statusName") {
//     //             if (value === "") {
//     //                 delete obj["status"]
//     //             } else {
//     //                 const objStatus = Object.entries(statusOrder);
//     //                 let status = "";
//     //                 objStatus.forEach((item) => {
//     //                     if (item[1] === value) {
//     //                         status = item[0]
//     //                         return
//     //                     }
//     //                 })
//     //                 obj["status"] = status.toUpperCase();
//     //             }
//     //         } else {
//     //             obj[key] = value
//     //         }
//     //         return obj
//     //     });
//     // };
//     const setParamsFilter = (key: string, value: string | number) => {
//         setParamsAPI((prevParams) => {
//             const obj = { ...prevParams };

//             if (key === "statusName") {
//                 if (value === "") {
//                     // Если фильтр сброшен, устанавливаем статус PAID
//                     obj["status"] = "PAID";
//                 } else {
//                     const objStatus = Object.entries(statusOrder);
//                     let status = "";
//                     objStatus.forEach((item) => {
//                         if (item[1] === value) {
//                             status = item[0];
//                             return;
//                         }
//                     });
//                     obj["status"] = status.toUpperCase();
//                 }
//             } else {
//                 obj[key] = value;
//             }
//             return obj;
//         });
//     };
//     if (isLoading) return (<p>Загрузка данных</p>);
//     if (error) return (<p>Ошибка</p>);

//     return (
//         <>
//             {notification && (
//                 <NotificationToast 
//                     message={notification.message}
//                     onClose={() => setNotification(null)}
//                 />
//             )}
//             {filteredOrders && (
//                 <TablePage 
//                     setParamsFilter={setParamsFilter} 
//                     style={style} 
//                     nameTable="orders" 
//                     orders={filteredOrders} 
//                     lengthRow={filteredOrders.length}
//                     onSearch={setSearchParams}
//                 />
//             )}
//         </>
//     );
// }

export default OrdersPage;
