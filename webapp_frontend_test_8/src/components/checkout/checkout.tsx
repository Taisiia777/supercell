
'use client'
import styles from "./checkout.module.scss"
import {useCart, useOrderData} from "@/components/store/store";
import Input from "@/components/ui/input/input";
import PrimaryButton from "@/components/ui/primary-button/primary-button";
import {useForm, SubmitHandler} from "react-hook-form";
import {useEffect, useState} from "react";
import {requestCode} from "@/actions/requestCode";
import {checkout} from "@/actions/checkout";
import {IProduct} from "@/types/products.interface";
import {useRouter} from "next/navigation";
import {useTelegram} from "@/app/useTg";
import Image from "next/image";
import linkInstructionImage from "@/images/link_instruction_without_enter.jpg";
import { usePendingOrder } from '@/components/store/pending-order-store';

interface FormValues {
    [key: string]: string;
}

interface ExpandedItem {
    id: number;
    uniqueId: string;
    account_id: string;
    game: string;
    type: string;
    count: number;
    friendUrl?: string; // Добавляем поле для хранения URL друга

}
interface CheckoutProduct {
    product_id: number;
    quantity: number;
    code: string | null;
    account_id: string;
    friend_url?: string; // Опциональное поле для URL_EMAIL
  }

export default function CheckOut(props: {data : IProduct[]}) {
    const { user, webApp } = useTelegram();
    const router = useRouter();
    const {items, updateCode, removeAll} = useCart();
    const {email} = useOrderData();
    const [state, setState] = useState<ExpandedItem[]>([]);
    const { setPaymentInfo } = usePendingOrder();


    useEffect(() => {
        const expandedItems = items.flatMap((item, itemIndex) => {
          // Получаем emails из массива или одиночного значения
          const emails = Array.isArray(item.account_id) ? 
            item.account_id : 
            (item.account_id ? [item.account_id] : []);
          
          return emails.map((email, index) => {

            const uniqueId = `${item.id}_${itemIndex}_${index}`;
      
            const expandedItem = {
              ...item,
              uniqueId: uniqueId,
              account_id: email,
            } as ExpandedItem;
            
            // Добавляем friendUrl для типа URL_EMAIL и URL_LINK
            if ((item.type === "URL_EMAIL" || item.type === "URL_LINK") && item.friendUrl) {
              expandedItem.friendUrl = item.friendUrl;
            }
            
            return expandedItem;
          });
        });
        
        setState(expandedItems);
      
        // Асинхронная отправка запросов на получение кодов
        const sendCodeRequests = async () => {
          const emailGroups = items
            // Отправляем коды только для EMAIL_CODE и URL_EMAIL
            .filter(item => item.type === "EMAIL_CODE" || item.type === "URL_EMAIL")
            .flatMap(item => 
              (Array.isArray(item.account_id) ? item.account_id : [item.account_id])
                .filter(email => email)
                .map(email => ({
                  game: item.game,
                  email: email
                }))
            );
      
          for (const emailGroup of emailGroups) {
            await requestCode([emailGroup]);
          }
        };
      
        sendCodeRequests();
      }, [items]);

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormValues>();
    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        try {
            console.log("Raw form data:", data);
            console.log("State items:", state);
            
            const products = state.map(item => {
                try {
                    // Базовый вариант для EMAIL_CODE - отправляем код и email
                    if (item.type === "EMAIL_CODE") {
                        return {
                            product_id: item.id,
                            quantity: 1,
                            code: data[item.uniqueId] || null, // Код подтверждения
                            account_id: item.account_id // Email
                        };
                    } 
                    // Для LINK - отправляем введенный код и ссылку в account_id
                    else if (item.type === "LINK") {
                        const combinedAccountId = `${item.account_id}|${item.friendUrl || ""}`.trim();
                        
                        return {
                            product_id: item.id,
                            quantity: 1,
                            code: data[item.uniqueId] || null, // Теперь отправляем введенный код
                            account_id: combinedAccountId // URL + доп ссылка
                        };
                    } 
                    // Для URL_EMAIL - отправляем код и аккаунт, ссылку в друзья сохраняем в коде
                    else if (item.type === "URL_EMAIL") {
                        // Объединим код и ссылку через разделитель
                        const combinedAccountId = `${item.account_id}|${item.friendUrl || ""}`.trim();
                        
                        return {
                            product_id: item.id,
                            quantity: 1,
                            code: data[item.uniqueId] || null, // Код
                            account_id: combinedAccountId // Основная ссылка + ссылка в друзья
                        };
                    } 
                    // Для URL_LINK - отправляем код и ссылку в account_id
                    else if (item.type === "URL_LINK") {
                        // Объединим основную ссылку и ссылку в друзья
                        const combinedAccountId = `${item.account_id}|${item.friendUrl || ""}`.trim();
                        
                        return {
                            product_id: item.id,
                            quantity: 1,
                            code: data[item.uniqueId] || null, // Код
                            account_id: combinedAccountId // Основная ссылка + ссылка в друзья
                        };
                    }
                    
                    // Для других типов
                    return {
                        product_id: item.id,
                        quantity: 1,
                        code: data[item.uniqueId] || null,
                        account_id: item.account_id
                    };
                } catch (itemError: any) {
                    throw itemError;
                }
            });
    
            // Остальной код остается без изменений
            const totalPrice = items.reduce((total, item) => {
                const product = props.data.find(product => product.id === item.id);
                if (product) {
                    return total + (Number(item.count) * Number(product.price.incl_tax));
                }
                return total;
            }, 0);
        
            const orderData = {
                products,
                email,
                total: totalPrice
            };
        
            console.log("Отправляемые данные:", JSON.stringify(orderData, null, 2));
            
            setCanPay(true);
            setOrder({ items: state, order: orderData });
        } catch (error: any) {
            console.error("Checkout error:", error);
            setCanPay(false);
        }
    };
    

    const [isCanPay, setCanPay] = useState(false);
    const [getOrder, setOrder] = useState<any>();

    // useEffect(() => {
    //     if(isCanPay && getOrder) {
    //         const processCheckout = async () => {
    //             try {
    //                 const res = await checkout(getOrder.order, webApp?.initData);
    //                 if(res && res.payment_url) {
                            
    //                         window.open(res.payment_url, '_blank', 'noopener,noreferrer');
                          

    //                     setCanPay(false);
    //                     removeAll();
    //                 }
    //             } catch (error) {
    //                 console.error("Checkout error:", error);
    //                 setCanPay(false);
    //             }
    //         };
    //         processCheckout();
    //     }
    // }, [isCanPay, getOrder]);

    const handleRequest = async (email: string, game: string) => {
        await requestCode([{ email, game }]);
    };

    useEffect(() => {
        if(isCanPay) {
          const fetchData = async () => {
            const updatedItems = getOrder.items;
            const order = getOrder.order;
            
            try {
              const res = await checkout(order, webApp?.initData);
              
              if(res && res.payment_url) {
                // Сохраняем информацию о платеже
                setPaymentInfo(res.id || res.number, res.payment_url);
                window.open(res.payment_url, '_blank', 'noopener,noreferrer');
                setCanPay(false);
                removeAll();
                router.push('/');
              }
            } catch (error) {
              console.error('Ошибка при оформлении заказа:', error);
              setCanPay(false);
            }
          };
          
          fetchData();
        }
      }, [isCanPay, getOrder]);
      
    return (
        <div className={styles.checkout}>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
               
            {state.map((item) => {
            if (item.type === "EMAIL_CODE" || item.type === "URL_EMAIL") {
                return (
                <div key={item.uniqueId} className={styles.code}>
                    <Input 
                    title="Введите код"
                    productId={item.id}
                    {...register(item.uniqueId, { 
                        required: true, 
                        minLength: 6, 
                        maxLength: 6, 
                        pattern: /^[0-9]*$/ 
                    })}
                    name={item.uniqueId}
                    value={watch()[item.uniqueId]}
                    style={errors[item.uniqueId] ? { 
                        boxShadow: "inset 4px 10px 30px 0 #f006" 
                    } : {}}
                    type_action="request_code"
                    validation="code"
                    requestClick={() => handleRequest(item.account_id, item.game)}
                    />
                    {errors[item.uniqueId] && (
                    <p className={styles.error}>
                        Код должен содержать 6 цифр
                    </p>
                    )}
                    <p>
                    На вашу почту <span>{item.account_id}</span> пришел код для входа. 
                    Его нужно ввести в поле выше без пробелов для игр(ы)
                    </p>
                    
                    {/* Если это URL_EMAIL, показываем дополнительную информацию о ссылке */}
                    {item.type === "URL_EMAIL" && item.friendUrl && (
                    <div className={styles.friendurl_info}>
                        <p>Ссылка в друзья: <span>{item.friendUrl}</span></p>
                    </div>
                    )}
                </div>
                );
            } 
            // Для типов с вводом кода и инструкцией
            else if (item.type === "LINK" || item.type === "URL_LINK") {
                return (
                <div key={item.uniqueId} className={styles.code}>
                    <Input 
                    title="Введите код"
                    productId={item.id}
                    {...register(item.uniqueId, { 
                        required: true, 
                        minLength: 6, 
                        maxLength: 6, 
                        pattern: /^[0-9]*$/ 
                    })}
                    name={item.uniqueId}
                    value={watch()[item.uniqueId]}
                    style={errors[item.uniqueId] ? { 
                        boxShadow: "inset 4px 10px 30px 0 #f006",
                        minWidth: "300px"
                    } : {minWidth: "300px"}}
                    validation="code"
                    />
                    {errors[item.uniqueId] && (
                    <p className={styles.error}>
                        Код должен содержать 6 цифр
                    </p>
                    )}
                    
                    {/* Для URL_LINK показываем дополнительную информацию о ссылке */}
                    {/* {item.type === "URL_LINK" && item.friendUrl && (
                    <div className={styles.friendurl_info}>
                        <p>Ссылка в друзья: <span>{item.friendUrl}</span></p>
                    </div>
                    )} */}
                    
                    <div className={styles.large_image_container}>
                    <Image 
                        src={linkInstructionImage} 
                        alt="Инструкция по ссылке" 
                        layout="fill" 
                        objectFit="cover"
                        className={styles.large_image}
                    />
                    </div>
                    <div className={styles.instruction}>
                        <h3 className={styles.instruction_title}>Инструкция:</h3>
                        <ol className={styles.instruction_steps}>
                            <li>Включив VPN, перейдите по ссылке на сайт <a href="https://store.supercell.com/ru" target="_blank" className={styles.instruction_link}>https://store.supercell.com/ru</a></li>
                            <li>Нажмите кнопку «ВХОД» в правом верхнем углу</li>
                            <li>Введите почту Supercell ID вашего аккаунта и нажмите «Вход»</li>
                            <li>Полученный шестизначный код на почту, необходимо вписать в поле выше, чтобы мы смогли войти по нему на сайт</li>
                        </ol>
                        <div className={styles.instruction_warning}>
                            <p><strong>ВАЖНО:</strong> не вводите полученный код сами на сайте, иначе он станет использованным.</p>
                        </div>
                    </div>
                </div>
                );
            }
            return null;
            })}
                <PrimaryButton title="Оплатить" type="submit"/>
            </form>
        </div>
    );
}
