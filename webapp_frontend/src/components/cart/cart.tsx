// @ts-nocheck
'use client'
import styles from "./cart.module.scss"
import {useCart, useOrderData} from "@/components/store/store";
import {IProduct} from "@/types/products.interface";
import React, {useEffect, useState} from "react";
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

const generateUniqueId = (baseId, index) => `${baseId}-${index}`;

export default function Cart(props: { data: IProduct[] }) {
    const router = useRouter();

    const { user, webApp } = useTelegram();
    const [profile, setProfile] = useState()
    const [isLoadingProfile, setLoadingProfile] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false);

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
                        setProfile(data)
                        console.log(data);
                        setLoadingProfile(false)
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        }
    }, [user]);

    const { items, addProductData, addItem } = useCart()


    const [isLoading, setLoading] = useState(false);

    // useEffect(() => {
    //     setLoading(true);
    //     if(profile) {
    //         const timeoutId = setTimeout(() => {
    //             setLoading(false);
    //         }, 1000);

    //         return () => clearTimeout(timeoutId);
    //     }
    // }, [profile]);

    const [clientItems, setClientItems] = useState<CartItem[]>([]);

    useEffect(() => {
        setClientItems(items)
    }, [items])

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
                game: product.game // Убедимся, что game передается
            }));
        });
        
        setFilteredData(expandedItems);
    }, [items, props.data]);

    const {setEmail, email} = useOrderData()

    type FormValues = {
        [key: string]: string | undefined;
    };

    const { register, handleSubmit, setValue, watch } = useForm<FormValues>();


    const onSubmit = handleSubmit((data) => {
        console.log("Форма отправляется", data);
        const productFormData = [];
        let emailFormData = null;
    
        Object.entries(data).forEach(([key, value]) => {
            if (key.endsWith("-email")) {
                // Получаем uniqueId без "-email" (например "123-0")
                const uniqueId = key.slice(0, -6);
                const item = filteredData.find((item) => item.uniqueId === uniqueId);
                
                if (item) {
                    const loginType = item.login_type;
                    const game = item.game;
                    productFormData.push({
                        productId: item.id.toString(),
                        uniqueId: uniqueId,
                        email: value,
                        loginType,
                        game
                    });
                }
            } else if (key === "email") {
                emailFormData = { email: value };
            }
        });
    
        console.log("Подготовленные данные:", productFormData);
        addProductData(productFormData);
        setEmail(emailFormData.email);
    
        router.push('/checkout');
    });

    const [totalPrice, setTotalPrice] = useState(0)

    useEffect(() => {
        filteredData.forEach((item) => {
            const uid = item.id.toString();
            const cartItem = clientItems.find((i) => i.id === item.id);
            const defaultValue = cartItem ? (item.login_type === "EMAIL_CODE" ? cartItem.account_id : cartItem.link) : '';
            
            setValue(uid, defaultValue);
            setValue("email", email);
    
            // Считаем общую сумму
            const totalPrice = filteredData.reduce((total, item) => {
                const product = filteredData.find(product => product.id === item.id);
                if (product) {
                    return total + (item.count * product.price.incl_tax);
                }
                return total;
            }, 0);
    
            setTotalPrice(totalPrice);
        });
    }, [filteredData]);

    const [formInitialized, setFormInitialized] = useState(false);


useEffect(() => {
  // Только при первой загрузке 
  if (profile?.game_email && !isLoadingProfile && !formInitialized) {
    filteredData.forEach(item => {
      const emailKey = `${item.uniqueId}-email`;
      // Проверяем текущее значение
      const currentEmailValue = watch(emailKey);

      // Заполняем только если поле действительно пустое
      if (!currentEmailValue || currentEmailValue === '') {
        const gameEmail = profile.game_email[item.game];
        if (gameEmail && item.login_type === "EMAIL_CODE") {
          setValue(emailKey, gameEmail);
        }
      }
          // То же самое для основного email
    const currentMainEmail = watch("email");
    if (!currentMainEmail || currentMainEmail === '') {
      const mainGameEmail = profile.game_email[filteredData[0]?.game];
      if (mainGameEmail) {
        setValue("email", mainGameEmail);  
      }
    }
    });


    
    setFormInitialized(true);
  }
}, [profile, isLoadingProfile]);


      
      // Добавьте очистку при размонтировании
      useEffect(() => {
        return () => {
          setFormInitialized(false);
        };
      }, []);

      // Получаем игру из первого товара в корзине
      const cartGame = filteredData[0]?.game;

      // Фильтруем и сортируем рекомендуемые товары
      const recommendedItems = props.data
          .filter(item => item.game === cartGame)
          // .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  
          
    return (
        <div className={styles.cart}>

            {filteredData.length > 0 ? (
              <>
              
                <form className={styles.items} onSubmit={onSubmit}     onError={(errors) => console.log('Form errors:', errors)}>
                    {filteredData.map((item) => {
                        const uid = item.id.toString();
                        const uid_email = item.uniqueId + "-email";
                        const cartItem = clientItems.find((i) => i.id === item.id)
                        const count = cartItem ? cartItem.count : 0

                        return (
                            <div className={styles.item} key={item.uniqueId}>
                                              <LinkInstructionModal 
                                                isOpen={isModalOpen}
                                                onClose={() => setIsModalOpen(false)}
                                                game={item.game}
                                              />
                                <Link href={`/product/${item.id}`} className={styles.content}>
                                    <div className={styles.container}>
                                        <div className={styles.img}>
                                            <div className={styles.bg}>
                                                {/* <Image src={item.images[0].original} alt={item.title} height={70} width={60}/> */}
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
                                                {item.login_type === "EMAIL_CODE" ? (
                                                    <svg width="13" height="14" viewBox="0 0 13 14" fill="none"
                                                         xmlns="http://www.w3.org/2000/svg">
                                                        <path
                                                            d="M1.81554 2.46414C1.64895 2.45747 1.48353 2.49316 1.33664 2.56747C1.18975 2.64177 1.06683 2.75195 0.980771 2.88643C0.339754 3.85715 8.97389e-05 4.97743 0.000213657 6.12049C0.000213657 6.35237 0.0980436 6.57476 0.272182 6.73872C0.44632 6.90269 0.682503 6.9948 0.928772 6.9948C1.17504 6.9948 1.41122 6.90269 1.58536 6.73872C1.7595 6.57476 1.85733 6.35237 1.85733 6.12049C1.85733 5.30389 2.10061 4.50302 2.55839 3.8097C2.6466 3.6802 2.69696 3.53109 2.70438 3.37741C2.7118 3.22373 2.67603 3.07093 2.60067 2.93443C2.52532 2.79793 2.41304 2.68257 2.27519 2.6C2.13734 2.51742 1.97879 2.47056 1.81554 2.46414Z"
                                                            fill="#6AEC3D"/>
                                                        <path fillRule="evenodd" clipRule="evenodd"
                                                              d="M0.913794 5.23396C0.667841 5.23764 0.433491 5.33307 0.262185 5.49928C0.0908792 5.6655 -0.00338209 5.88892 9.27744e-05 6.12051V10.5471C9.27744e-05 10.779 0.0979227 11.0014 0.272061 11.1654C0.4462 11.3293 0.682382 11.4214 0.928651 11.4214C1.17492 11.4214 1.4111 11.3293 1.58524 11.1654C1.75938 11.0014 1.85721 10.779 1.85721 10.5471V6.12051C1.85897 6.00348 1.83575 5.88731 1.78894 5.77889C1.74212 5.67047 1.67267 5.572 1.58469 5.48932C1.4967 5.40664 1.39199 5.34144 1.27675 5.29757C1.1615 5.25371 1.03808 5.23208 0.913794 5.23396Z"
                                                              fill="#6AEC3D"/>
                                                        <path
                                                            d="M6.50006 2.62326C4.45909 2.62326 2.78583 4.19963 2.78583 6.12049C2.78583 6.35237 2.88366 6.57475 3.0578 6.73872C3.23193 6.90268 3.46812 6.9948 3.71439 6.9948C3.96065 6.9948 4.19684 6.90268 4.37098 6.73872C4.54511 6.57475 4.64294 6.35237 4.64294 6.12049C4.64294 5.14476 5.46286 4.37187 6.50006 4.37187C7.53633 4.37187 8.35718 5.14476 8.35718 6.12049C8.35718 6.35237 8.45501 6.57475 8.62915 6.73872C8.80328 6.90268 9.03947 6.9948 9.28574 6.9948C9.532 6.9948 9.76819 6.90268 9.94233 6.73872C10.1165 6.57475 10.2143 6.35237 10.2143 6.12049C10.2143 4.19963 8.5401 2.62326 6.50006 2.62326Z"
                                                            fill="#6AEC3D"/>
                                                        <path fillRule="evenodd" clipRule="evenodd"
                                                              d="M6.48514 5.23396C6.23919 5.23764 6.00484 5.33307 5.83353 5.49928C5.66223 5.6655 5.56797 5.88892 5.57144 6.12051V10.492C5.57144 10.492 5.57051 11.0123 5.70515 11.6461C5.8398 12.2809 6.08865 13.0896 6.77207 13.7331C6.85773 13.8166 6.96019 13.8832 7.07347 13.929C7.18676 13.9749 7.30861 13.999 7.4319 14C7.55519 14.001 7.67747 13.9789 7.79158 13.9349C7.9057 13.891 8.00937 13.826 8.09656 13.7439C8.18374 13.6619 8.25269 13.5642 8.29938 13.4568C8.34607 13.3493 8.36956 13.2342 8.36849 13.1181C8.36742 13.002 8.34181 12.8873 8.29314 12.7806C8.24448 12.674 8.17374 12.5775 8.08505 12.4968C7.83898 12.266 7.62356 11.7633 7.52606 11.3052C7.42856 10.8461 7.42856 10.492 7.42856 10.492V6.12051C7.43032 6.00348 7.4071 5.88731 7.36029 5.77889C7.31347 5.67047 7.24402 5.572 7.15604 5.48932C7.06805 5.40664 6.96334 5.34144 6.8481 5.29757C6.73285 5.25371 6.60943 5.23208 6.48514 5.23396ZM3.69947 5.23396C3.45352 5.23764 3.21917 5.33307 3.04786 5.49928C2.87655 5.6655 2.78229 5.88892 2.78577 6.12051V6.99482C2.78577 7.2267 2.8836 7.44908 3.05774 7.61305C3.23187 7.77701 3.46806 7.86913 3.71433 7.86913C3.9606 7.86913 4.19678 7.77701 4.37092 7.61305C4.54505 7.44908 4.64288 7.2267 4.64288 6.99482V6.12051C4.64464 6.00348 4.62142 5.88731 4.57461 5.77889C4.5278 5.67047 4.45834 5.572 4.37036 5.48932C4.28238 5.40664 4.17766 5.34144 4.06242 5.29757C3.94718 5.25371 3.82376 5.23208 3.69947 5.23396ZM3.69947 8.73119C3.45352 8.73488 3.21917 8.8303 3.04786 8.99651C2.87655 9.16273 2.78229 9.38615 2.78577 9.61774V12.2407C2.78577 12.4725 2.8836 12.6949 3.05774 12.8589C3.23187 13.0229 3.46806 13.115 3.71433 13.115C3.9606 13.115 4.19678 13.0229 4.37092 12.8589C4.54505 12.6949 4.64288 12.4725 4.64288 12.2407V9.61774C4.64464 9.50071 4.62142 9.38454 4.57461 9.27612C4.5278 9.1677 4.45834 9.06923 4.37036 8.98655C4.28238 8.90387 4.17766 8.83867 4.06242 8.7948C3.94718 8.75094 3.82376 8.72931 3.69947 8.73119ZM9.27082 5.23396C9.02487 5.23764 8.79052 5.33307 8.61921 5.49928C8.4479 5.6655 8.35364 5.88892 8.35712 6.12051V10.492C8.35712 10.492 8.36547 10.8767 8.51962 11.3148C8.73403 11.8982 9.08941 12.4267 9.55774 12.8588C9.6434 12.9423 9.74586 13.0089 9.85915 13.0547C9.97244 13.1006 10.0943 13.1247 10.2176 13.1257C10.3409 13.1267 10.4631 13.1046 10.5773 13.0606C10.6914 13.0166 10.795 12.9517 10.8822 12.8696C10.9694 12.7875 11.0384 12.6899 11.0851 12.5825C11.1317 12.475 11.1552 12.3599 11.1542 12.2438C11.1531 12.1277 11.1275 12.013 11.0788 11.9063C11.0302 11.7997 10.9594 11.7032 10.8707 11.6225C10.5151 11.2885 10.36 10.979 10.2829 10.7622C10.2049 10.5445 10.2142 10.492 10.2142 10.492V6.12051C10.216 6.00348 10.1928 5.88731 10.146 5.77889C10.0991 5.67047 10.0297 5.572 9.94171 5.48932C9.85373 5.40664 9.74901 5.34144 9.63377 5.29757C9.51853 5.25371 9.39511 5.23208 9.27082 5.23396ZM12.0565 5.23396C11.8105 5.23764 11.5762 5.33307 11.4049 5.49928C11.2336 5.6655 11.1393 5.88892 11.1428 6.12051V6.99482C11.1428 7.2267 11.2406 7.44908 11.4148 7.61305C11.5889 7.77701 11.8251 7.86913 12.0714 7.86913C12.3176 7.86913 12.5538 7.77701 12.7279 7.61305C12.9021 7.44908 12.9999 7.2267 12.9999 6.99482V6.12051C13.0017 6.00348 12.9784 5.88731 12.9316 5.77889C12.8848 5.67047 12.8154 5.572 12.7274 5.48932C12.6394 5.40664 12.5347 5.34144 12.4194 5.29757C12.3042 5.25371 12.1808 5.23208 12.0565 5.23396Z"
                                                                fill="#6AEC3D"/>
                                                        <path
                                                            d="M6.56686 0.00032889C5.43366 -0.0107351 4.31709 0.257523 3.32805 0.778463C3.22154 0.834378 3.12776 0.9095 3.05208 0.999539C2.9764 1.08958 2.9203 1.19277 2.88697 1.30323C2.85365 1.41368 2.84375 1.52923 2.85785 1.64329C2.87196 1.75734 2.90978 1.86767 2.96917 1.96796C3.02855 2.06825 3.10833 2.15655 3.20396 2.22781C3.29958 2.29907 3.40918 2.35189 3.52649 2.38327C3.6438 2.41465 3.76652 2.42397 3.88765 2.41069C4.00879 2.39741 4.12595 2.36179 4.23247 2.30588C4.93889 1.93343 5.73653 1.7415 6.54612 1.74917C7.35571 1.75684 8.14908 1.96384 8.8474 2.34959C9.54628 2.73482 10.1259 3.28559 10.5286 3.94714C10.9313 4.60869 11.143 5.35798 11.1428 6.12048C11.1428 6.35237 11.2406 6.57475 11.4148 6.73871C11.5889 6.90268 11.8251 6.99479 12.0714 6.99479C12.3176 6.99479 12.5538 6.90268 12.7279 6.73871C12.9021 6.57475 12.9999 6.35237 12.9999 6.12048C12.9994 5.05312 12.7026 4.00442 12.1391 3.07829C11.5755 2.15217 10.7648 1.38077 9.7871 0.840539C8.81019 0.300899 7.70036 0.0112427 6.56779 0.00032889H6.56686Z"
                                                            fill="#6AEC3D"/>
                                                        <path
                                                            d="M13 9.61771C13 9.84959 12.9021 10.072 12.728 10.2359C12.5539 10.3999 12.3177 10.492 12.0714 10.492C11.8251 10.492 11.589 10.3999 11.4148 10.2359C11.2407 10.072 11.1429 9.84959 11.1429 9.61771C11.1429 9.38583 11.2407 9.16344 11.4148 8.99948C11.589 8.83552 11.8251 8.7434 12.0714 8.7434C12.3177 8.7434 12.5539 8.83552 12.728 8.99948C12.9021 9.16344 13 9.38583 13 9.61771Z"
                                                            fill="#6AEC3D"/>
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
                                    <Input
                                        title={item.login_type === "EMAIL_CODE" ? "Почта Supercell ID" : "Ссылка в друзья"}
                                        productId={item.id}
                                        {...register(uid_email, { 
                                            required: true,
                                          })}
                                        name={uid_email}
                                        setValue={setValue}
                                        value={watch(uid_email)}
                                        validation="email"
                                        editable={false}
                                        

                                        icon={item.login_type === "EMAIL_CODE" ? (
                                          <>
                                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="28" viewBox="0 0 43 38" fill="none">
                                            <rect x="6.32373" y="5.60498" width="30.2835" height="26.7893" rx="8.60124" fill="black"/>
                                            <path fill="white" d="M13.4914 11.0942V27.2645H16.7975V11.0942H13.4914ZM30.7922 14.3283C30.7205 14.0588 30.5682 13.7623 30.3352 13.4389C30.1381 13.1694 29.8604 12.855 29.502 12.4957C29.1615 12.1363 28.8479 11.8578 28.5612 11.6602C28.2387 11.4266 27.943 11.2739 27.6742 11.202C27.4054 11.1302 27.0739 11.0942 26.6797 11.0942H18.616V27.2645H26.6797C27.0739 27.2645 27.4054 27.2285 27.6742 27.1567C27.943 27.0848 28.2387 26.9321 28.5612 26.6985C28.83 26.5188 29.1436 26.2493 29.502 25.89C29.8604 25.5306 30.1381 25.2072 30.3352 24.9198C30.5682 24.5964 30.7205 24.2999 30.7922 24.0304C30.8638 23.7609 30.8997 23.4285 30.8997 23.0333V15.3254C30.8997 14.9302 30.8638 14.5978 30.7922 14.3283ZM27.1635 14.7056C27.4681 15.011 27.6205 15.1907 27.6205 15.2446V23.1141C27.6205 23.168 27.4681 23.3477 27.1635 23.6531C26.8589 23.9585 26.6797 24.1113 26.6259 24.1113H21.8953V14.2474H26.6259C26.6797 14.2474 26.8589 14.4002 27.1635 14.7056Z"/>
                                          </svg>
                                          </>): (
                                             <>
                                            <svg
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setIsModalOpen(true);
                                              }}
                                            width="24" height="21" viewBox="0 0 24 21" fill="none"
                                                 xmlns="http://www.w3.org/2000/svg">
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
                                             </>
                                          )}
                                    />

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

                      <div className={styles.popular}>
                        <h3>Может пригодиться</h3>
                        <div className={styles.items}>
                            {recommendedItems.map((item) => {
                                const cartItem = clientItems.find((i) => i.id === item.id)
                                const count = cartItem ? cartItem.count : 0
                                
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
                                                <ButtonAdd id={item.id} game={item.game}/>
                                            ) : (
                                                <ActionButtons id={item.id} count={count} game={item.game}/>
                                            )}
                                    
                                    </div>
                                )
                            })}
                        </div>
                      </div>

                </>
            ) : (

              <div className={styles.null}>
                <h2>Корзина пустая</h2>
                <p>А товаров полно — забегайте посмотреть</p>
                <Link href="/catalog" className={styles['to-catalog']}>
                  К товарам
                </Link>
                
                    <div className={styles.popular}>
                        <h3>Может пригодиться</h3>
                        <div className={styles.items}>
                            {props.data.slice(0, 16).map((item) => {
                                const cartItem = clientItems.find((i) => i.id === item.id)
                                const count = cartItem ? cartItem.count : 0
                                
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
                                                <ButtonAdd id={item.id} game={item.game}/>
                                            ) : (
                                                <ActionButtons id={item.id} count={count} game={item.game}/>
                                            )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
              </div>
            )}

        </div>
    )
}
