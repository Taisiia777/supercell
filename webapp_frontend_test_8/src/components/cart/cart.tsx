

// @ts-nocheck
'use client'
import styles from "./cart.module.scss"
import {useCart, useOrderData} from "@/components/store/store";
import {IProduct} from "@/types/products.interface";
import React, {useEffect, useState, memo} from "react";
import Input from "@/components/ui/input/input";
import PrimaryButton from "@/components/ui/primary-button/primary-button";
import {CartItem} from "@/types/store.interface";
import Link from "next/link";
import Image from "next/image";
import {Shimmer} from "react-shimmer";
import shimmer from "@/components/ui/shimmer/shimmer.module.scss";
import ActionButtons from "@/components/ui/action-buttons/action-buttons";
import ButtonAdd from "@/components/ui/button-add/button";
import {useForm} from "react-hook-form";
import {useRouter} from 'next/navigation';
import {useTelegram} from "@/app/useTg";
import LinkInstructionModal from "../LinkInstructionModal/LinkInstructionModal";
import { usePendingOrder } from '@/components/store/pending-order-store';
import { PendingOrder, PendingOrderItem } from '@/types/pending-order.interface';

// Стили для разделения блоков корзины и рекомендаций
const containerStyles = {
  cartContainer: {
    display: 'flex',
    flexDirection: 'column'
  },
  cartContent: {
    position: 'relative',
    marginBottom: '30px'
  },
  recommendationsContainer: {
    position: 'relative',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255, 255, 255, 0.11)',
    willChange: 'transform',
    transform: 'translateZ(0)',
    overflow: 'hidden'
  }
};

const generateUniqueId = (baseId, index) => `${baseId}-${index}`;

// Мемоизированный компонент для рекомендаций
const RecommendedProducts = memo(({ products, isLoading, items }) => {
  return (
    <div className={styles.popular}>
      <h3>Может пригодиться</h3>
      <div className={styles.items}>
        {products.map((item) => {
          const cartItem = items.find((i) => i.id === item.id);
          const count = cartItem ? cartItem.count : 0;
          
          return (
            <div key={item.id} className={styles['popular-item']}>
              <Link href={`/product/${item.id}`}>
                <div className={styles['image-container']}>
                  <Image 
                    src={item.images[0].original}
                    alt={item.title}
                    fill
                    className={styles.img}
                  />
                </div>
                <div className={styles.details}>
                  <div className={styles.price}>
                    {item.price.incl_tax} ₽
                  </div>
                  <div className={styles.title}>
                    {item.title}
                  </div>
                </div>
              </Link>
              {isLoading ? (
                <Shimmer width={120} height={31}
                         className={`${shimmer.shimmer_btn} shimmer`}/>
              ) : count < 1 ? (
                <ButtonAdd id={item.id} game={item.game} loginType={item.login_type} />

              ) : (
                <ActionButtons id={item.id} count={count} game={item.game} loginType={item.login_type} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

// Обеспечиваем отображение имени компонента в инструментах разработчика
RecommendedProducts.displayName = 'RecommendedProducts';

export default function Cart(props: { data: IProduct[] }) {
    const router = useRouter();

    const { user, webApp } = useTelegram();
    const [profile, setProfile] = useState();
    const [isLoadingProfile, setLoadingProfile] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [emailsFilledOnce, setEmailsFilledOnce] = useState(false);
    const { setPendingOrder } = usePendingOrder();
    
    const savePendingOrder = (emailValue: string) => {
        // Создаем массив элементов для незавершенного заказа
        const pendingOrderItems: PendingOrderItem[] = items.map(item => {
          // Находим детали продукта из переданных данных
          const productDetails = props.data.find(product => product.id === item.id);
          
          return {
            ...item,
            productDetails: productDetails ? {
              id: productDetails.id,
              title: productDetails.title,
              price: productDetails.price,
              images: productDetails.images && productDetails.images.length > 0 
                ? [{ original: productDetails.images[0].original }] 
                : []
            } : undefined
          };
        });
      
        // Вычисляем общую стоимость заказа
        const totalPrice = props.data.reduce((total, item) => {
          const cartItem = items.find(i => i.id === item.id);
          if (cartItem) {
            return total + (cartItem.count * parseFloat(item.price.incl_tax));
          }
          return total;
        }, 0);
      
        // Создаем объект незавершенного заказа
        const pendingOrder: PendingOrder = {
          items: pendingOrderItems,
          email: emailValue,
          createdAt: Date.now(),
          totalPrice
        };
      
        // Сохраняем заказ в хранилище
        setPendingOrder(pendingOrder);
    };
    
    useEffect(() => {
        if(user && webApp?.initData) {
            fetch(process.env.API_URL + "customer/me/", {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${webApp.initData}`,
                },
                cache: "no-cache"
            })
                .then((response) => response.json())
                .then((data) => {
                    if(data) {
                        setProfile(data);
                        console.log(data);
                        setLoadingProfile(false);
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        }
    }, [user, webApp]);

    const { items, addProductData, addItem } = useCart();
    const [isLoading, setLoading] = useState(false);
    const [clientItems, setClientItems] = useState<CartItem[]>([]);

    useEffect(() => {
        setClientItems(items);
    }, [items]);

    const [filteredData, setFilteredData] = useState<IProduct[]>([]);

    useEffect(() => {
        const expandedItems = items.flatMap(item => {
            const product = props.data.find(p => p.id === item.id);
            if (!product) return [];
            
            return Array(item.count).fill(0).map((_, index) => ({
                ...product,
                uniqueId: generateUniqueId(item.id, index),
                cartItemId: item.id,
                count: 1,
                email: item.email,
                code: item.code,
                type: item.type,
                game: product.game
            }));
        });
        
        setFilteredData(expandedItems);
    }, [items, props.data]);

    const {setEmail, email} = useOrderData();

    type FormValues = {
        [key: string]: string | undefined;
    };

    const { register, handleSubmit, setValue, watch } = useForm<FormValues>();

    const onSubmit = handleSubmit((data) => {
        window.location.href = "https://t.me/m/Tx4nscbcMTNi";

        // const productFormData = [];
        // let emailFormData = null;
        
        // // Предварительно проверим наличие некорректных ссылок и очистим их
        // Object.keys(data).forEach(key => {
        //     if (key.endsWith("-friendUrl")) {
        //         const url = data[key]?.toLowerCase() || '';
        //         const isValidFriendUrl = url.includes('link.clashroyale.com') || 
        //                                  url.includes('link.brawlstars.com') || 
        //                                  url.includes('link.clashofclans.com');
                
        //         if (url && !isValidFriendUrl) {
        //             // Очищаем некорректную ссылку
        //             data[key] = '';
        //         }
        //     }
        // });
    
        // // Теперь обрабатываем email-поля и собираем данные
        // Object.entries(data).forEach(([key, value]) => {
        //     if (key.endsWith("-email")) {
        //         const uniqueId = key.slice(0, -6);
        //         const item = filteredData.find((item) => item.uniqueId === uniqueId);
                
        //         if (item) {
        //             const loginType = item.login_type;
        //             const game = item.game;
                    
        //             const productData = {
        //                 productId: item.id.toString(),
        //                 uniqueId: uniqueId,
        //                 email: value,
        //                 loginType,
        //                 game
        //             };
                    
        //             // Добавляем friendUrl, если он валидный
        //             if (loginType === "URL_EMAIL" || loginType === "URL_LINK") {
        //                 const friendUrlKey = `${uniqueId}-friendUrl`;
        //                 if (data[friendUrlKey]) {
        //                     productData.friendUrl = data[friendUrlKey];
        //                 }
        //             }
                    
        //             productFormData.push(productData);
        //         }
        //     } else if (key === "email") {
        //         emailFormData = { email: value };
        //     }
        // });
        
        // console.log("Подготовленные данные:", productFormData);
        // addProductData(productFormData);
        // setEmail(emailFormData.email);
        // savePendingOrder(emailFormData.email);
    
        // router.push('/checkout');
    });
   
    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        filteredData.forEach((item) => {
            const uid = item.id.toString();
            const cartItem = clientItems.find((i) => i.id === item.id);
            const defaultValue = cartItem ? (item.login_type === "EMAIL_CODE" ? cartItem.account_id : cartItem.link) : '';
            
            setValue(uid, defaultValue);
            setValue("email", email);
    
            // Считаем общую сумму
            const totalPrice = filteredData.reduce((total, item) => {
                return total + parseFloat(item.price.incl_tax);
            }, 0);
    
            setTotalPrice(totalPrice);
        });
    }, [filteredData, clientItems, email, setValue]);

    // Автозаполнение почты из профиля только один раз
    useEffect(() => {
        // Проверяем, что профиль загружен, не идет загрузка и заполнение не выполнялось ранее
        if (profile && !isLoadingProfile && !emailsFilledOnce && profile.game_email) {
          console.log("Начинаем автозаполнение из профиля:", profile.game_email);
          
          // Для каждого товара в корзине
          filteredData.forEach((item) => {
            // Создаем правильный ключ для поля email
            const emailKey = `${item.uniqueId}-email`;
            
            // Получаем почту из профиля для соответствующей игры
            const gameEmail = profile.game_email[item.game];
            
            // Если для игры есть почта в профиле и товар требует email
            if (gameEmail && (item.login_type === "EMAIL_CODE" || item.login_type === "LINK" || 
                item.login_type === "URL_EMAIL" || item.login_type === "URL_LINK")) {
              // Заполняем поле почты
              setValue(emailKey, gameEmail);
              console.log(`Автозаполнение для ${item.title} (${emailKey}): ${gameEmail}`);
            }
          });
          
          // Установка email для чека из первого найденного email в профиле
          if (!watch("email")) {
            const firstGame = Object.keys(profile.game_email).find(game => profile.game_email[game]);
            if (firstGame) {
              setValue("email", profile.game_email[firstGame]);
              console.log(`Установлен email для чека: ${profile.game_email[firstGame]}`);
            }
          }
          
          // Отмечаем, что заполнение уже выполнено
          setEmailsFilledOnce(true);
        }
    }, [profile, isLoadingProfile, filteredData, emailsFilledOnce, setValue, watch]);


    // Добавьте этот новый эффект после существующего эффекта автозаполнения
    useEffect(() => {
        // Выполняем только если профиль загружен и есть данные в game_email
        if (profile && !isLoadingProfile && profile.game_email) {
        // Проходим по всем товарам в корзине
        filteredData.forEach((item) => {
            const emailKey = `${item.uniqueId}-email`;
            const currentValue = watch(emailKey);
            
            // Заполняем поле email только если оно пустое и есть соответствующая почта в профиле
            if (!currentValue && profile.game_email[item.game]) {
            setValue(emailKey, profile.game_email[item.game]);
            console.log(`Автозаполнение для нового товара ${item.title} (${emailKey}): ${profile.game_email[item.game]}`);
            }
        });
        }
    }, [filteredData, profile, isLoadingProfile, setValue, watch]);
    
    // Получаем игру из первого товара в корзине для рекомендаций
    const cartGame = filteredData[0]?.game;

    // Фильтруем и сортируем рекомендуемые товары
    const recommendedItems = props.data
        .filter(item => item.game === cartGame);
        
    return (
        <div className={styles.cart}>
            {/* Разделяем верстку на контейнеры */}
            <div style={containerStyles.cartContainer}>
                {/* Блок корзины */}
                <div style={containerStyles.cartContent}>
                    {filteredData.length > 0 ? (
                        <form className={styles.items} onSubmit={onSubmit} onError={(errors) => console.log('Form errors:', errors)}>
                            <LinkInstructionModal 
                                isOpen={isModalOpen}
                                onClose={() => setIsModalOpen(false)}
                                game={cartGame}
                            />
                            {filteredData.map((item) => {
                                const uid_email = item.uniqueId + "-email";
                                const cartItem = clientItems.find((i) => i.id === item.id);
                                const count = cartItem ? cartItem.count : 0;

                                return (
                                    <div className={styles.item} key={item.uniqueId}>
                                        <Link href={`/product/${item.id}`} className={styles.content}>
                                            <div className={styles.container}>
                                                <div className={styles.img}>
                                                    <div className={styles.bg}>
                                                        <div className={styles.imageWrapper}>
                                                            <Image 
                                                                src={item.images[0].original} 
                                                                alt={item.title} 
                                                                height={70} 
                                                                width={60}
                                                                style={{ objectFit: 'contain', width: 'auto', height: '70px' }}
                                                                quality={100}
                                                                unoptimized={true}
                                                                loading="eager"
                                                                priority
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className={styles.type}>
                                                        {(item.login_type === "EMAIL_CODE" || item.login_type === "URL_EMAIL" )? (
                                                                                          <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                          <path d="M2.09474 2.81615C1.90251 2.80853 1.71164 2.84932 1.54215 2.93424C1.37267 3.01916 1.23083 3.14508 1.13153 3.29877C0.3919 4.40816 -2.08729e-05 5.68848 0.000122109 6.99484C0.000122109 7.25985 0.113003 7.514 0.313932 7.70139C0.514861 7.88878 0.787379 7.99405 1.07154 7.99405C1.35569 7.99405 1.62821 7.88878 1.82914 7.70139C2.03007 7.514 2.14295 7.25985 2.14295 6.99484C2.14295 6.06158 2.42366 5.1463 2.95187 4.35393C3.05364 4.20594 3.11175 4.03552 3.12031 3.85989C3.12888 3.68426 3.0876 3.50962 3.00065 3.35363C2.9137 3.19763 2.78416 3.06579 2.6251 2.97142C2.46604 2.87705 2.28309 2.82349 2.09474 2.81615Z" fill="#6AEC3D" />
                                                                                          <path fillRule="evenodd" clipRule="evenodd" d="M1.05438 5.98164C0.770586 5.98584 0.500181 6.0949 0.302521 6.28486C0.104861 6.47482 -0.00390241 6.73016 0.000107047 6.99483V12.0538C0.000107047 12.3188 0.112988 12.573 0.313917 12.7604C0.514846 12.9478 0.787364 13.053 1.07152 13.053C1.35568 13.053 1.6282 12.9478 1.82912 12.7604C2.03005 12.573 2.14293 12.3188 2.14293 12.0538V6.99483C2.14496 6.86109 2.11817 6.72832 2.06416 6.60441C2.01014 6.4805 1.93 6.36796 1.82848 6.27347C1.72697 6.17898 1.60614 6.10446 1.47317 6.05433C1.3402 6.0042 1.19779 5.97948 1.05438 5.98164Z" fill="#6AEC3D" />
                                                                                          <path d="M7.50007 2.998C5.1451 2.998 3.21442 4.79958 3.21442 6.99484C3.21442 7.25984 3.3273 7.514 3.52823 7.70139C3.72916 7.88877 4.00167 7.99405 4.28583 7.99405C4.56999 7.99405 4.8425 7.88877 5.04343 7.70139C5.24436 7.514 5.35724 7.25984 5.35724 6.99484C5.35724 5.87972 6.3033 4.99642 7.50007 4.99642C8.69577 4.99642 9.6429 5.87972 9.6429 6.99484C9.6429 7.25984 9.75578 7.514 9.95671 7.70139C10.1576 7.88877 10.4302 7.99405 10.7143 7.99405C10.9985 7.99405 11.271 7.88877 11.4719 7.70139C11.6728 7.514 11.7857 7.25984 11.7857 6.99484C11.7857 4.79958 9.85396 2.998 7.50007 2.998Z" fill="#6AEC3D" />
                                                                                          <path fillRule="evenodd" clipRule="evenodd" d="M7.48285 5.98164C7.19906 5.98584 6.92865 6.0949 6.73099 6.28486C6.53333 6.47482 6.42457 6.73016 6.42858 6.99483V11.9909C6.42858 11.9909 6.42751 12.5854 6.58286 13.3098C6.73822 14.0353 7.02536 14.9595 7.81392 15.6949C7.91275 15.7904 8.03098 15.8665 8.16169 15.9189C8.29241 15.9712 8.433 15.9988 8.57526 16C8.71753 16.0011 8.85861 15.9758 8.99028 15.9256C9.12195 15.8753 9.24158 15.8012 9.34218 15.7073C9.44277 15.6135 9.52233 15.502 9.5762 15.3792C9.63007 15.2564 9.65718 15.1248 9.65595 14.9921C9.65471 14.8594 9.62515 14.7283 9.569 14.6064C9.51285 14.4845 9.43123 14.3742 9.3289 14.2821C9.04497 14.0183 8.7964 13.4437 8.68391 12.9201C8.57141 12.3956 8.57141 11.9909 8.57141 11.9909V6.99483C8.57343 6.86109 8.54665 6.72832 8.49263 6.60441C8.43862 6.4805 8.35847 6.36796 8.25696 6.27347C8.15544 6.17898 8.03461 6.10446 7.90164 6.05433C7.76867 6.0042 7.62626 5.97948 7.48285 5.98164ZM4.26861 5.98164C3.98482 5.98584 3.71441 6.0949 3.51675 6.28486C3.31909 6.47482 3.21033 6.73016 3.21434 6.99483V7.99404C3.21434 8.25905 3.32722 8.5132 3.52815 8.70059C3.72908 8.88798 4.0016 8.99325 4.28575 8.99325C4.56991 8.99325 4.84243 8.88798 5.04336 8.70059C5.24429 8.5132 5.35717 8.25905 5.35717 7.99404V6.99483C5.35919 6.86109 5.33241 6.72832 5.27839 6.60441C5.22438 6.4805 5.14423 6.36796 5.04272 6.27347C4.9412 6.17898 4.82037 6.10446 4.6874 6.05433C4.55443 6.0042 4.41202 5.97948 4.26861 5.98164ZM4.26861 9.97847C3.98482 9.98268 3.71441 10.0917 3.51675 10.2817C3.31909 10.4717 3.21033 10.727 3.21434 10.9917V13.9893C3.21434 14.2543 3.32722 14.5085 3.52815 14.6958C3.72908 14.8832 4.0016 14.9885 4.28575 14.9885C4.56991 14.9885 4.84243 14.8832 5.04336 14.6958C5.24429 14.5085 5.35717 14.2543 5.35717 13.9893V10.9917C5.35919 10.8579 5.33241 10.7252 5.27839 10.6012C5.22438 10.4773 5.14423 10.3648 5.04272 10.2703C4.9412 10.1758 4.82037 10.1013 4.6874 10.0512C4.55443 10.001 4.41202 9.97632 4.26861 9.97847ZM10.6971 5.98164C10.4133 5.98584 10.1429 6.0949 9.94523 6.28486C9.74757 6.47482 9.63881 6.73016 9.64282 6.99483V11.9909C9.64282 11.9909 9.65246 12.4305 9.83032 12.9311C10.0777 13.5979 10.4878 14.202 11.0282 14.6957C11.127 14.7912 11.2452 14.8673 11.3759 14.9197C11.5067 14.972 11.6472 14.9996 11.7895 15.0007C11.9318 15.0019 12.0728 14.9766 12.2045 14.9264C12.3362 14.8761 12.4558 14.8019 12.5564 14.7081C12.657 14.6143 12.7366 14.5027 12.7904 14.3799C12.8443 14.2571 12.8714 14.1256 12.8702 13.9929C12.8689 13.8602 12.8394 13.7291 12.7832 13.6072C12.7271 13.4853 12.6455 13.375 12.5431 13.2829C12.1328 12.9012 11.9539 12.5474 11.8649 12.2996C11.7749 12.0508 11.7856 11.9909 11.7856 11.9909V6.99483C11.7877 6.86109 11.7609 6.72832 11.7069 6.60441C11.6529 6.4805 11.5727 6.36796 11.4712 6.27347C11.3697 6.17898 11.2489 6.10446 11.1159 6.05433C10.9829 6.0042 10.8405 5.97948 10.6971 5.98164ZM13.9113 5.98164C13.6275 5.98584 13.3571 6.0949 13.1595 6.28486C12.9618 6.47482 12.8531 6.73016 12.8571 6.99483V7.99404C12.8571 8.25905 12.9699 8.5132 13.1709 8.70059C13.3718 8.88798 13.6443 8.99325 13.9285 8.99325C14.2126 8.99325 14.4851 8.88798 14.6861 8.70059C14.887 8.5132 14.9999 8.25905 14.9999 7.99404V6.99483C15.0019 6.86109 14.9751 6.72832 14.9211 6.60441C14.8671 6.4805 14.787 6.36796 14.6854 6.27347C14.5839 6.17898 14.4631 6.10446 14.3301 6.05433C14.1971 6.0042 14.0547 5.97948 13.9113 5.98164Z" fill="#6AEC3D" />
                                                                                          <path d="M7.5771 0.000375874C6.26955 -0.0122687 4.98121 0.294312 3.84001 0.889672C3.71711 0.953575 3.60891 1.03943 3.52158 1.14233C3.43426 1.24523 3.36952 1.36317 3.33107 1.4894C3.29262 1.61563 3.2812 1.7477 3.29747 1.87805C3.31375 2.00839 3.35739 2.13448 3.42591 2.2491C3.49443 2.36372 3.58649 2.46462 3.69682 2.54606C3.80716 2.6275 3.93362 2.68788 4.06897 2.72374C4.20433 2.7596 4.34594 2.77025 4.4857 2.75507C4.62547 2.7399 4.76067 2.69919 4.88357 2.63529C5.69867 2.20963 6.61902 1.99029 7.55316 1.99905C8.48731 2.00782 9.40273 2.24438 10.2085 2.68525C11.0149 3.12551 11.6837 3.75496 12.1483 4.51102C12.613 5.26708 12.8573 6.1234 12.857 6.99484C12.857 7.25985 12.9699 7.514 13.1708 7.70139C13.3718 7.88878 13.6443 7.99405 13.9284 7.99405C14.2126 7.99405 14.4851 7.88878 14.686 7.70139C14.887 7.514 14.9999 7.25985 14.9999 6.99484C14.9992 5.775 14.6568 4.57648 14.0066 3.51805C13.3564 2.45962 12.4208 1.57802 11.2928 0.960616C10.1656 0.343884 8.88497 0.0128488 7.57817 0.000375874H7.5771Z" fill="#6AEC3D" />
                                                                                          <path d="M14.9999 10.9917C14.9999 11.2567 14.8871 11.5108 14.6861 11.6982C14.4852 11.8856 14.2127 11.9909 13.9285 11.9909C13.6444 11.9909 13.3719 11.8856 13.1709 11.6982C12.97 11.5108 12.8571 11.2567 12.8571 10.9917C12.8571 10.7266 12.97 10.4725 13.1709 10.2851C13.3719 10.0977 13.6444 9.99245 13.9285 9.99245C14.2127 9.99245 14.4852 10.0977 14.6861 10.2851C14.8871 10.4725 14.9999 10.7266 14.9999 10.9917Z" fill="#6AEC3D" />
                                                                                      </svg>
                                                        ) : (
                                                            <svg width="14" height="13" viewBox="0 0 14 13" fill="none"
                                                                xmlns="http://www.w3.org/2000/svg">
                                                                <path
                                                                    d="M5.5 2.375H2.5C1.67157 2.375 1 2.99061 1 3.75V10.625C1 11.3844 1.67157 12 2.5 12H10C10.8284 12 11.5 11.3844 11.5 10.625V7.875M8.5 1H13M13 1V5.125M13 1L5.5 7.875"
                                                                    stroke="#FDB834" strokeLinecap="round" strokeLinejoin="round"/>
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={styles.product}>
                                                    <h3 className={styles.name}>
                                                        {item.title}
                                                    </h3>
                                                    <div className={styles.category}>
                                                        <svg width="14" height="13" viewBox="0 0 14 13" fill="none"
                                                            xmlns="http://www.w3.org/2000/svg">
                                                            <path
                                                                d="M3.74997 3.32741H3.75677M6.103 0.666668H4.25987C3.11791 0.666668 2.54693 0.666668 2.11076 0.881495C1.72709 1.07046 1.41516 1.37199 1.21968 1.74286C0.997437 2.16448 0.997437 2.71642 0.997437 3.82029V5.60196C0.997437 6.084 0.997437 6.32506 1.05377 6.55192C1.10372 6.75303 1.18611 6.94527 1.29791 7.12168C1.424 7.32055 1.60033 7.49098 1.95298 7.8319L5.14744 10.9198C5.9549 11.7003 6.35869 12.0907 6.8242 12.2369C7.23377 12.3655 7.67488 12.3655 8.08445 12.2369C8.54996 12.0907 8.95375 11.7003 9.7612 10.9198L11.6043 9.13816C12.4118 8.35763 12.8156 7.96731 12.9668 7.51732C13.0999 7.12141 13.0999 6.69502 12.9668 6.29911C12.8156 5.84912 12.4118 5.4588 11.6043 4.67827L8.40988 1.59034C8.0572 1.24945 7.88089 1.079 7.67515 0.957117C7.49266 0.849046 7.29379 0.76941 7.08574 0.721127C6.85105 0.666668 6.60168 0.666668 6.103 0.666668ZM4.08981 3.32741C4.08981 3.50884 3.93767 3.65591 3.74997 3.65591C3.56229 3.65591 3.41014 3.50884 3.41014 3.32741C3.41014 3.14598 3.56229 2.9989 3.74997 2.9989C3.93767 2.9989 4.08981 3.14598 4.08981 3.32741Z"
                                                                stroke="#FFC567" strokeLinecap="round" strokeLinejoin="round"/>
                                                        </svg>
                                                        <span>{item.categories}</span>
                                                    </div>
                                                    <div className={styles.actions}>
                                                        <p className={styles.price}>{item.price.incl_tax} ₽</p>
                                                        <div className={styles.add}>
                                                            <>
                                                                {
                                                                    isLoading ? (
                                                                        <Shimmer width={100} height={31}
                                                                                className={`${shimmer.shimmer_btn} shimmer`}/>
                                                                    ) : (
                                                                        <ActionButtons id={item.id} count={count} game={item.game} style={{
                                                                            background: "#242C3B",
                                                                            padding: "0 4px",
                                                                            boxShadow: "inset 2px 2px 4px 0 #1e2531, inset -2px -2px 4px 0 #273041"
                                                                        }}/>
                                                                    )
                                                                }
                                                            </>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                        <div className={styles.data}>
                                            {item.login_type === "EMAIL_CODE" && (
                                                <Input
                                                title="Почта Supercell ID"
                                                productId={item.id}
                                                {...register(uid_email, { required: true })}
                                                name={uid_email}
                                                setValue={setValue}
                                                value={watch(uid_email)}
                                                validation="email"
                                                editable={false}
                                                icon={
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="28" viewBox="0 0 43 38" fill="none">
                                                    <rect x="6.32373" y="5.60498" width="30.2835" height="26.7893" rx="8.60124" fill="black"/>
                                                    <path fill="white" d="M13.4914 11.0942V27.2645H16.7975V11.0942H13.4914ZM30.7922 14.3283C30.7205 14.0588 30.5682 13.7623 30.3352 13.4389C30.1381 13.1694 29.8604 12.855 29.502 12.4957C29.1615 12.1363 28.8479 11.8578 28.5612 11.6602C28.2387 11.4266 27.943 11.2739 27.6742 11.202C27.4054 11.1302 27.0739 11.0942 26.6797 11.0942H18.616V27.2645H26.6797C27.0739 27.2645 27.4054 27.2285 27.6742 27.1567C27.943 27.0848 28.2387 26.9321 28.5612 26.6985C28.83 26.5188 29.1436 26.2493 29.502 25.89C29.8604 25.5306 30.1381 25.2072 30.3352 24.9198C30.5682 24.5964 30.7205 24.2999 30.7922 24.0304C30.8638 23.7609 30.8997 23.4285 30.8997 23.0333V15.3254C30.8997 14.9302 30.8638 14.5978 30.7922 14.3283ZM27.1635 14.7056C27.4681 15.011 27.6205 15.1907 27.6205 15.2446V23.1141C27.6205 23.168 27.4681 23.3477 27.1635 23.6531C26.8589 23.9585 26.6797 24.1113 26.6259 24.1113H21.8953V14.2474H26.6259C26.6797 14.2474 26.8589 14.4002 27.1635 14.7056Z"/>
                                                    </svg>
                                                }
                                                />
                                            )}

                                            {item.login_type === "LINK" && (
                                                <Input
                                                title="Почта Supercell ID"
                                                productId={item.id}
                                                {...register(uid_email, { required: true })}
                                                name={uid_email}
                                                setValue={setValue}
                                                value={watch(uid_email)}
                                                validation="email"
                                                editable={false}
                                                icon={
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="28" viewBox="0 0 43 38" fill="none">
                                                    <rect x="6.32373" y="5.60498" width="30.2835" height="26.7893" rx="8.60124" fill="black"/>
                                                    <path fill="white" d="M13.4914 11.0942V27.2645H16.7975V11.0942H13.4914ZM30.7922 14.3283C30.7205 14.0588 30.5682 13.7623 30.3352 13.4389C30.1381 13.1694 29.8604 12.855 29.502 12.4957C29.1615 12.1363 28.8479 11.8578 28.5612 11.6602C28.2387 11.4266 27.943 11.2739 27.6742 11.202C27.4054 11.1302 27.0739 11.0942 26.6797 11.0942H18.616V27.2645H26.6797C27.0739 27.2645 27.4054 27.2285 27.6742 27.1567C27.943 27.0848 28.2387 26.9321 28.5612 26.6985C28.83 26.5188 29.1436 26.2493 29.502 25.89C29.8604 25.5306 30.1381 25.2072 30.3352 24.9198C30.5682 24.5964 30.7205 24.2999 30.7922 24.0304C30.8638 23.7609 30.8997 23.4285 30.8997 23.0333V15.3254C30.8997 14.9302 30.8638 14.5978 30.7922 14.3283ZM27.1635 14.7056C27.4681 15.011 27.6205 15.1907 27.6205 15.2446V23.1141C27.6205 23.168 27.4681 23.3477 27.1635 23.6531C26.8589 23.9585 26.6797 24.1113 26.6259 24.1113H21.8953V14.2474H26.6259C26.6797 14.2474 26.8589 14.4002 27.1635 14.7056Z"/>
                                                    </svg>
                                                }
                                                />
                                            )}

                                            {(item.login_type === "URL_EMAIL" || item.login_type === "URL_LINK") && (
                                                <>
                                                <Input
                                                    title="Почта Supercell ID"
                                                    productId={item.id}
                                                    // {...register(uid_email, { required: true })}
                                                    {...register(uid_email, { 
                                                        required: true,
                                                        pattern: {
                                                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                          message: "Некорректный email адрес"
                                                        }
                                                      })}
                                                    name={uid_email}
                                                    setValue={setValue}
                                                    value={watch(uid_email)}
                                                    validation="email"
                                                    editable={false}
                                                    icon={
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="28" viewBox="0 0 43 38" fill="none">
                                                        <rect x="6.32373" y="5.60498" width="30.2835" height="26.7893" rx="8.60124" fill="black"/>
                                                        <path fill="white" d="M13.4914 11.0942V27.2645H16.7975V11.0942H13.4914ZM30.7922 14.3283C30.7205 14.0588 30.5682 13.7623 30.3352 13.4389C30.1381 13.1694 29.8604 12.855 29.502 12.4957C29.1615 12.1363 28.8479 11.8578 28.5612 11.6602C28.2387 11.4266 27.943 11.2739 27.6742 11.202C27.4054 11.1302 27.0739 11.0942 26.6797 11.0942H18.616V27.2645H26.6797C27.0739 27.2645 27.4054 27.2285 27.6742 27.1567C27.943 27.0848 28.2387 26.9321 28.5612 26.6985C28.83 26.5188 29.1436 26.2493 29.502 25.89C29.8604 25.5306 30.1381 25.2072 30.3352 24.9198C30.5682 24.5964 30.7205 24.2999 30.7922 24.0304C30.8638 23.7609 30.8997 23.4285 30.8997 23.0333V15.3254C30.8997 14.9302 30.8638 14.5978 30.7922 14.3283ZM27.1635 14.7056C27.4681 15.011 27.6205 15.1907 27.6205 15.2446V23.1141C27.6205 23.168 27.4681 23.3477 27.1635 23.6531C26.8589 23.9585 26.6797 24.1113 26.6259 24.1113H21.8953V14.2474H26.6259C26.6797 14.2474 26.8589 14.4002 27.1635 14.7056Z"/>
                                                    </svg>
                                                    }
                                                />
                                                
                                                <Input
                                                    title="Ссылка в друзья (не обязательно)"
                                                    productId={item.id}
                                                    {...register(`${item.uniqueId}-friendUrl`, { required: false })}
                                                    name={`${item.uniqueId}-friendUrl`}
                                                    setValue={setValue}
                                                    value={watch(`${item.uniqueId}-friendUrl`)}
                                                    validation="friendUrl"
                                                    editable={false}
                                                    icon={
                                                    <svg
                                                        onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setIsModalOpen(true);
                                                        }}
                                                        width="24" height="21" viewBox="0 0 24 21" fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <path opacity="0.5"
                                                        d="M1 10.5C1 6.02165 1 3.78248 2.61092 2.39125C4.22182 1 6.81455 1 12 1C17.1854 1 19.7782 1 21.389 2.39125C23 3.78248 23 6.02165 23 10.5C23 14.9783 23 17.2175 21.389 18.6087C19.7782 20 17.1854 20 12 20C6.81455 20 4.22182 20 2.61092 18.6087C1 17.2175 1 14.9783 1 10.5Z"
                                                        stroke="white" strokeWidth="2"/>
                                                        <path
                                                        d="M10 6.875C10 5.83947 10.8955 5 12 5C13.1045 5 14 5.83947 14 6.875C14 7.56245 13.6053 8.1635 13.017 8.4899C12.5099 8.7711 12 9.1977 12 9.75V11"
                                                        stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                                        <path
                                                        d="M12 15C12.5523 15 13 14.5523 13 14C13 13.4477 12.5523 13 12 13C11.4477 13 11 13.4477 11 14C11 14.5523 11.4477 15 12 15Z"
                                                        fill="white"/>
                                                    </svg>
                                                    }
                                                />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                            <div className={styles.action}>
                                <Input
                                    title="EMAIL для чека"
                                    {...register("email", { 
                                        required: true,
                                    })}
                                    name="email"
                                    setValue={setValue}
                                    value={watch().email}
                                    validation="email"
                                    editable={false}
                                />
                                <PrimaryButton 
                                    type="submit" 
                                    title="Оформить заказ" 
                                    subtitle={`Сумма: ${totalPrice} ₽`}
                                />
                            </div>
                        </form>
                    ) : (
                        <div className={styles.null}>
                            <h2>Корзина пустая</h2>
                            <p>А товаров полно — забегайте посмотреть</p>
                            <Link href="/catalog" className={styles['to-catalog']}>
                                К товарам
                            </Link>
                        </div>
                    )}
                </div>
                
                {/* Отдельный блок для рекомендаций, вынесен за пределы условного рендеринга */}
                <div style={containerStyles.recommendationsContainer}>
                    <RecommendedProducts 
                        products={filteredData.length > 0 ? recommendedItems : props.data.slice(0, 16)} 
                        isLoading={isLoading}
                        items={clientItems}
                    />
                </div>
            </div>
        </div>
    );
}