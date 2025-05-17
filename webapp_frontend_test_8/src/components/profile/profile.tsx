//@ts-nocheck
'use client'
import {IProfile} from "@/types/profile.interface";
import styles from "./profile.module.scss"
import Input from "@/components/ui/input/input";
import PrimaryButton from "@/components/ui/primary-button/primary-button";
import img2 from "@/images/categories_mini/image2.png";
import img3 from "@/images/categories_mini/image3.png";
import img4 from "@/images/categories_mini/image1.png";
import img5 from "@/images/categories_mini/image4.png";
import Image from "next/image";
import {useTelegram} from "@/app/useTg";
import {useForm} from "react-hook-form";
import {useEffect, useState} from "react";
import {updateProfile} from "@/actions/updateProfile";
import Link from "next/link";
import ProfileOrders from '../ProfileOrders/ProfileOrders';
import ProfileCard from '../ProfileCard/ProfileCard';
// import BalanceCard from "../BalanceCard/BalanceCard"
import supercellIcon from '@/images/supercell_id.png';

export default function Profile() {
    const { user, webApp } = useTelegram();
    const [profile, setProfile] = useState();
    const [activeTab, setActiveTab] = useState('profile');
    
    const [isLoading, setLoading] = useState(true);
    const [formErrors, setFormErrors] = useState({});
    const [referralBalance, setReferralBalance] = useState(0);
    const [referralLink, setReferralLink] = useState('');
    const [referrals, setReferrals] = useState([]);
    const [copyStatus, setCopyStatus] = useState('');
    const [paymentBank, setPaymentBank] = useState('');
    const [paymentPhone, setPaymentPhone] = useState('');
    const [isSocialSubmitSuccessful, setIsSocialSubmitSuccessful] = useState(false);
    // Добавьте эти функции в ваш компонент Profile
// Функция, которая возвращает закодированный SVG для иконки соцсети
const getSocialIcon = (type) => {
  const icons = {
    tiktok: `%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512'%3E%3Cpath fill='white' d='M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z'/%3E%3C/svg%3E`,
    telegram: `%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 496 512'%3E%3Cpath fill='white' d='M248,8C111.033,8,0,119.033,0,256S111.033,504,248,504,496,392.967,496,256,384.967,8,248,8ZM362.952,176.66c-3.732,39.215-19.881,134.378-28.1,178.3-3.476,18.584-10.322,24.816-16.948,25.425-14.4,1.326-25.338-9.517-39.287-18.661-21.827-14.308-34.158-23.215-55.346-37.177-24.485-16.135-8.612-25,5.342-39.5,3.652-3.793,67.107-61.51,68.335-66.746.153-.655.3-3.1-1.154-4.384s-3.59-.849-5.135-.5q-3.283.746-104.608,69.142-14.845,10.194-26.894,9.934c-8.855-.191-25.888-5.006-38.551-9.123-15.531-5.048-27.875-7.717-26.8-16.291q.84-6.7,18.45-13.7,108.446-47.248,144.628-62.3c68.872-28.647,83.183-33.623,92.511-33.789,2.052-.034,6.639.474,9.61,2.885a10.452,10.452,0,0,1,3.53,6.716A43.765,43.765,0,0,1,362.952,176.66Z'/%3E%3C/svg%3E`,
    youtube: `%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 576 512'%3E%3Cpath fill='white' d='M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z'/%3E%3C/svg%3E`,
    instagram: `%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512'%3E%3Cpath fill='white' d='M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z'/%3E%3C/svg%3E`,
    vk: `%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 576 512'%3E%3Cpath fill='white' d='M545 117.7c3.7-12.5 0-21.7-17.8-21.7h-58.9c-15 0-21.9 7.9-25.6 16.7 0 0-30 73.1-72.4 120.5-13.7 13.7-20 18.1-27.5 18.1-3.7 0-9.4-4.4-9.4-16.9V117.7c0-15-4.2-21.7-16.6-21.7h-92.6c-9.4 0-15 7-15 13.5 0 14.2 21.2 17.5 23.4 57.5v86.8c0 19-3.4 22.5-10.9 22.5-20 0-68.6-73.4-97.4-157.4-5.8-16.3-11.5-22.9-26.6-22.9H38.8c-16.8 0-20.2 7.9-20.2 16.7 0 15.6 20 93.1 93.1 195.5C160.4 378.1 229 416 291.4 416c37.5 0 42.1-8.4 42.1-22.9 0-66.8-3.4-73.1 15.4-73.1 8.7 0 23.7 4.4 58.7 38.1 40 40 46.6 57.9 69 57.9h58.9c16.8 0 25.3-8.4 20.4-25-11.2-34.9-86.9-106.7-90.3-111.5-8.7-11.2-6.2-16.2 0-26.2.1-.1 72-101.3 79.4-135.6z'/%3E%3C/svg%3E`
  };
  
  return icons[type] || getPlusIcon();
};

// Функция для создания иконки "плюс" (по умолчанию)
const getPlusIcon = () => {
  return `%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512'%3E%3Cpath fill='white' d='M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z'/%3E%3C/svg%3E`;
};

    // Валидация email
    const validateEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !email || emailRegex.test(email);
    };
  
    const [socialInputs, setSocialInputs] = useState([{ id: 1, type: '', link: '' }]);

    // Добавьте функцию для добавления нового социального инпута
    const addSocialInput = () => {
    setSocialInputs([...socialInputs, { 
        id: socialInputs.length + 1, 
        type: '', 
        link: '' 
    }]);
    };

    // Добавьте функцию для обновления значений соцсетей
    const updateSocialInput = (id, field, value) => {
    setSocialInputs(socialInputs.map(input => 
        input.id === id ? { ...input, [field]: value } : input
    ));
    };

    // Добавьте функцию для удаления инпута соцсети
    const removeSocialInput = (id) => {
    if (socialInputs.length > 1) {
        setSocialInputs(socialInputs.filter(input => input.id !== id));
    }
    };

    const handleUpdateEmail = async (field, value) => {
      if (!validateEmail(value)) {
        return false;
      }
    
      const updatedData = {
        brawl_stars: field === 'brawl_stars' ? value : profile?.game_email?.brawl_stars,
        clash_of_clans: field === 'clash_of_clans' ? value : profile?.game_email?.clash_of_clans,
        clash_royale: field === 'clash_royale' ? value : profile?.game_email?.clash_royale,
        hay_day: field === 'hay_day' ? value : profile?.game_email?.hay_day
      };
    
      try {
        await updateProfile(updatedData, webApp?.initData);
        setProfile(prev => ({
          ...prev,
          game_email: updatedData
        }));
        return true;
      } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        return false;
      }
    };

    const clearEmail = async (field) => {
        const updatedData = {
            brawl_stars: field === 'brawl_stars' ? '' : profile?.game_email?.brawl_stars || '',
            clash_of_clans: field === 'clash_of_clans' ? '' : profile?.game_email?.clash_of_clans || '',
            clash_royale: field === 'clash_royale' ? '' : profile?.game_email?.clash_royale || '',
            hay_day: field === 'hay_day' ? '' : profile?.game_email?.hay_day || ''
        };
    
        try {
            await updateProfile(updatedData, webApp?.initData);
            setProfile(prev => ({
                ...prev,
                game_email: updatedData
            }));
            setValue(field, '');
        } catch (error) {
            console.error('Ошибка при очистке email:', error);
        }
    };
  

    const fetchProfileData = async () => {
        if (user && webApp?.initData) {
          try {
            setLoading(true);
            // Сначала получаем базовую информацию о пользователе
            const response = await fetch(process.env.API_URL + "customer/me/", {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${webApp.initData}`,
              },
              cache: "no-cache"
            });
            
            if (!response.ok) {
              throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            const userData = await response.json();
            setProfile(userData);
            
            // Устанавливаем базовые email-адреса из профиля
            if (userData && userData.game_email) {
              setValue('brawl_stars', userData.game_email.brawl_stars || '');
              setValue('clash_of_clans', userData.game_email.clash_of_clans || '');
              setValue('clash_royale', userData.game_email.clash_royale || '');
              setValue('hay_day', userData.game_email.hay_day || '');
            }
    
            // Получаем детальную информацию о пользователе из референс-системы
            if (userData && userData.id) {
              try {
                const detailsResponse = await fetch(`${process.env.API_URL}customer/referral/users/${userData.id}/details/`, {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${webApp.initData}`,
                  }
                });
                
                if (detailsResponse.ok) {
                  const referralData = await detailsResponse.json();
                  
                  // Обновляем состояние с данными из реферальной системы
                  setReferralBalance(referralData.referrer_earnings || 0);
                  setReferralLink(referralData.ref_link || '');
                  setReferrals(referralData.referrals || []);
                  
                  // Обновляем профиль с полной информацией
                  setProfile(prevProfile => ({
                    ...prevProfile,
                    referral_balance: referralData.referrer_earnings,
                    referral_link: referralData.ref_link,
                    social_media: referralData.social_media,
                    bank_details: referralData.bank_details,
                    referrals: referralData.referrals,
                    orders: referralData.orders,
                    payments: referralData.payments
                  }));
                  
                  // Если уже есть сохраненные социальные данные, заполняем их
                  if (referralData.social_media && Object.keys(referralData.social_media).length > 0) {
                    const socialData = [];
                    Object.entries(referralData.social_media).forEach(([type, link], index) => {
                      if (link) {
                        socialData.push({ id: index + 1, type, link });
                      }
                    });
                    
                    if (socialData.length > 0) {
                      setSocialInputs(socialData);
                    }
                  }
                  
                      // Если есть банковские данные, заполняем их
                      if (referralData.bank_details && referralData.bank_details.bank) {
                          setPaymentBank(referralData.bank_details.bank);
                          setValueRef('bank', referralData.bank_details.bank);
                      }
                      
                      if (referralData.bank_details && referralData.bank_details.phone) {
                          setPaymentPhone(referralData.bank_details.phone);
                          setValueRef('phone', referralData.bank_details.phone);
                      }
                }
              } catch (refError) {
                console.error('Ошибка загрузки данных о рефералах:', refError);
              }
            }
          } catch (error) {
            console.error('Ошибка загрузки профиля:', error);
          } finally {
            setLoading(false);
          }
        }
      };



    useEffect(() => {
        fetchProfileData();
      }, [user, webApp?.initData]);


    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm();
    const { register: registerRef, handleSubmit: handleSubmitRef, formState: { errors: errorsRef }, setValue: setValueRef, watch: watchRef } = useForm();

    const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);
    const [isReferralSubmitSuccessful, setIsReferralSubmitSuccessful] = useState(false);

    useEffect(() => {
        if(profile && profile.game_email) {
            setValue("brawl_stars", profile.game_email.brawl_stars);
            setValue("clash_of_clans", profile.game_email.clash_of_clans);
            setValue("clash_royale", profile.game_email.clash_royale);
            setValue("hay_day", profile.game_email.hay_day);
        }
    }, [profile]);

    // Функция копирования в буфер обмена
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                setCopyStatus('Скопировано!');
                setTimeout(() => setCopyStatus(''), 2000);
            })
            .catch(err => {
                console.error('Не удалось скопировать текст: ', err);
                setCopyStatus('Ошибка копирования');
                setTimeout(() => setCopyStatus(''), 2000);
            });
    };

    const onSocialSubmit = async () => {
        try {
          // Получаем все существующие соцсети из профиля
          const existingSocialMedia = profile?.social_media || {};
          
          // Создаем новый объект с существующими соцсетями, где все значения будут пустыми строками
          // Это гарантирует, что удаленные соцсети будут отправлены с пустыми значениями
          const socialMediaObject = Object.keys(existingSocialMedia).reduce((acc, type) => {
            acc[type] = ""; // По умолчанию устанавливаем пустую строку для всех имеющихся типов
            return acc;
          }, {});
          
          // Теперь добавляем или обновляем значения из текущих инпутов
          socialInputs.forEach(input => {
            if (input.type) {
              socialMediaObject[input.type] = input.link || "";
            }
          });
          
          // Отправляем только данные соцсетей
          const response = await fetch(`${process.env.API_URL}customer/referral/users/${profile.id}/update/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${webApp.initData}`,
            },
            body: JSON.stringify({
              social_media: socialMediaObject
            })
          });
          
          const result = await response.json();
          
          if (response.ok && result.status) {
            setIsSocialSubmitSuccessful(true);
            setTimeout(() => setIsSocialSubmitSuccessful(false), 3000);
            
            // Обновляем данные профиля
            fetchProfileData();
          } else {
            console.error('Ошибка при сохранении соцсетей:', result.error || 'Неизвестная ошибка');
            alert('Не удалось сохранить данные соцсетей. Пожалуйста, попробуйте позже.');
          }
        } catch (error) {
          console.error('Ошибка сохранения соцсетей:', error);
          alert('Произошла ошибка при сохранении соцсетей');
        }
      };

      const onReferralSubmit = async (data) => {
        try {
          const referralData = {
            bank_details: {
              bank: data.bank || paymentBank,
              phone: data.phone || paymentPhone
            }
          };
          
          const response = await fetch(`${process.env.API_URL}customer/referral/users/${profile.id}/update/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${webApp.initData}`,
            },
            body: JSON.stringify(referralData)
          });
          
          const result = await response.json();
          
          if (response.ok && result.status) {
            setIsReferralSubmitSuccessful(true);
            setTimeout(() => setIsReferralSubmitSuccessful(false), 3000);
            
            // Обновляем данные профиля
            fetchProfileData();
          } else {
            console.error('Ошибка при сохранении данных:', result.error || 'Неизвестная ошибка');
            alert('Не удалось сохранить данные. Пожалуйста, попробуйте позже.');
          }
        } catch (error) {
          console.error('Ошибка обновления банковских данных:', error);
          alert('Произошла ошибка при обновлении данных');
        }
      };


    const socialLinks = [
        { name: 'tiktok', label: 'TikTok' },
        { name: 'telegram', label: 'Telegram канал' },
        { name: 'youtube', label: 'YouTube канал' },
        { name: 'instagram', label: 'Instagram' },
        { name: 'vk', label: 'ВКонтакте' },

    ];

    const banks = [
        'Сбербанк',
        'Тинькофф',
        'Альфа-Банк',
        'ВТБ',
        'Райффайзен',
        'Газпромбанк',
        'СБП',
        'Другой'
    ];

    return (
        <div className={styles.profile}>
            <div className={styles.tabs_container}>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Профиль
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'referral' ? styles.active : ''}`}
                        onClick={() => setActiveTab('referral')}
                    >
                        Рефералы
                    </button>
                    <div 
                        className={`${styles.tab_slider} ${activeTab === 'referral' ? styles.slide_right : ''}`}
                    />
                </div>
            </div>

            {activeTab === 'profile' ? (
                <>
    <ProfileCard profileId={user?.id} />
    <ProfileOrders orders={profile?.orders} />

                    <form className={styles.form}>
                        {/* <Input 
                            title="ID ВАШЕГО ПРОФИЛЯ" 
                            value={user?.id ?? ''} 
                            copy={true} 
                            name="id" 
                            background={true}
                        /> */}
                        <p>
                            {/* <svg xmlns="http://www.w3.org/2000/svg" width="32" height="28" viewBox="0 0 43 38" fill="none">
                                <rect x="6.32373" y="5.60498" width="30.2835" height="26.7893" rx="8.60124" fill="black"/>
                                <path fill="white" d="M13.4914 11.0942V27.2645H16.7975V11.0942H13.4914ZM30.7922 14.3283C30.7205 14.0588 30.5682 13.7623 30.3352 13.4389C30.1381 13.1694 29.8604 12.855 29.502 12.4957C29.1615 12.1363 28.8479 11.8578 28.5612 11.6602C28.2387 11.4266 27.943 11.2739 27.6742 11.202C27.4054 11.1302 27.0739 11.0942 26.6797 11.0942H18.616V27.2645H26.6797C27.0739 27.2645 27.4054 27.2285 27.6742 27.1567C27.943 27.0848 28.2387 26.9321 28.5612 26.6985C28.83 26.5188 29.1436 26.2493 29.502 25.89C29.8604 25.5306 30.1381 25.2072 30.3352 24.9198C30.5682 24.5964 30.7205 24.2999 30.7922 24.0304C30.8638 23.7609 30.8997 23.4285 30.8997 23.0333V15.3254C30.8997 14.9302 30.8638 14.5978 30.7922 14.3283ZM27.1635 14.7056C27.4681 15.011 27.6205 15.1907 27.6205 15.2446V23.1141C27.6205 23.168 27.4681 23.3477 27.1635 23.6531C26.8589 23.9585 26.6797 24.1113 26.6259 24.1113H21.8953V14.2474H26.6259C26.6797 14.2474 26.8589 14.4002 27.1635 14.7056Z"/>
                            </svg>  */}
                          <Image 
                            src={supercellIcon} 
                            width={32} 
                            height={28} 
                            alt="Supercell ID Logo" 
                            style={{marginRight: '8px'}}
                          />
                            Привязанные почты Supercell ID
                        </p>
                        <Input 
                            title="Почта clash_royale" 
                            icon={<Image className={styles.gameIcon} src={img4} alt="" height={35} width={35} style={{borderRadius:"5px"}}/>}
                            {...register("clash_royale")}
                            name="clash_royale"
                            setValue={setValue}
                            value={watch().clash_royale}
                            rotate={true}
                            onClear={() => clearEmail('clash_royale')}
                            onUpdate={(value) => handleUpdateEmail('clash_royale', value)}
                            editable={true}
                            clearable={true}
                            validation="email"
                        />

                        <Input 
                            title="Почта brawl_stars" 
                            icon={<Image className={styles.gameIcon} src={img2} alt="" height={35} width={35} style={{borderRadius:"5px"}}/>}
                            {...register("brawl_stars")}
                            name="brawl_stars"
                            setValue={setValue}
                            value={watch().brawl_stars}
                            rotate={true}
                            onClear={() => clearEmail('brawl_stars')}
                            onUpdate={(value) => handleUpdateEmail('brawl_stars', value)}
                            validation="email"
                            editable={true}
                            clearable={true}
                        />

                        <Input 
                            title="Почта clash_of_clans" 
                            icon={<Image className={styles.gameIcon} src={img3} alt="" height={35} width={35} style={{borderRadius:"5px"}}/>}
                            {...register("clash_of_clans")}
                            name="clash_of_clans"
                            setValue={setValue}
                            value={watch().clash_of_clans}
                            rotate={true}
                            onClear={() => clearEmail('clash_of_clans')}
                            onUpdate={(value) => handleUpdateEmail('clash_of_clans', value)}
                            validation="email"
                            editable={true}
                            clearable={true}
                        />

                        <Input 
                            title="Почта stumble guys" 
                            icon={<Image className={styles.gameIcon} src={img5} alt="" height={35} width={35} style={{borderRadius:"5px"}}/>}
                            {...register("hay_day")}
                            name="hay_day"
                            setValue={setValue}
                            value={watch().hay_day}
                            rotate={true}
                            onClear={() => clearEmail('hay_day')}
                            onUpdate={(value) => handleUpdateEmail('hay_day', value)}
                            validation="email"
                            editable={true}
                            clearable={true}
                        />
                    </form>
                    <Link href={`https://t.me/Mamosupport`} className={styles.support}>
            <svg width="34" height="30" viewBox="0 0 44 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path opacity="0.975" fillRule="evenodd" clipRule="evenodd" d="M15.1456 0C16.1633 0 17.181 0 18.1987 0C22.0921 0.341725 25.6041 2.01204 28.7347 5.01096C30.8224 7.09878 32.2492 9.77906 33.015 13.0518C33.7262 16.9919 33.1875 20.6173 31.3987 23.9283C29.389 27.2843 26.8248 29.6538 23.7061 31.0369C19.4917 32.8023 15.2413 32.9707 10.9551 31.5418C10.1748 32.0752 9.41654 32.6578 8.68028 33.2898C7.00678 34.3374 5.25078 35.0496 3.41225 35.4263C3.00281 35.4283 2.87311 35.1952 3.02313 34.7271C4.50449 33.0316 5.33261 30.908 5.50749 28.3566C3.19356 26.4025 1.52734 23.7611 0.508844 20.4323C0.273243 19.5358 0.103629 18.6294 0 17.7131C0 16.755 0 15.7968 0 14.8386C0.570309 10.6663 2.16668 7.31268 4.78912 4.77789C7.89606 1.94468 11.3482 0.352053 15.1456 0ZM15.385 2.09761C18.9906 1.83279 22.4028 2.75211 25.6218 4.85558C27.3048 6.04617 28.7515 7.6129 29.9619 9.55578C32.3486 14.1321 32.3087 18.664 29.8422 23.1514C27.6431 26.3865 24.9193 28.5489 21.6708 29.6384C17.9856 30.7816 14.324 30.6651 10.6857 29.2888C10.5066 29.3467 10.337 29.4374 10.1769 29.5608C9.15859 30.5069 8.08104 31.3356 6.94422 32.0468C6.77355 32.1717 6.59396 32.2235 6.40545 32.2022C6.90615 30.7037 7.20547 29.137 7.30341 27.502C6.64023 26.8245 5.96179 26.1642 5.26803 25.5209C3.9791 24.1041 2.97139 22.4079 2.2449 20.4323C1.15928 16.7965 1.43864 13.3522 3.083 10.0996C4.6251 7.3484 6.6106 5.31554 9.03946 4.001C11.0857 2.93413 13.201 2.29966 15.385 2.09761Z" fill="#FDFDFD" />
                <path opacity="0.975" fillRule="evenodd" clipRule="evenodd" d="M43.9999 26.7251C43.9999 26.9582 43.9999 27.1912 43.9999 27.4243C43.7605 30.3635 42.7229 32.7071 40.887 34.4552C40.6952 34.6781 40.5256 34.924 40.3782 35.1932C40.3409 35.6153 40.4407 35.9779 40.6775 36.2809C41.2562 36.9801 41.8348 37.6793 42.4135 38.3785C42.5397 38.6015 42.5297 38.8086 42.3836 39C42.244 39 42.1042 39 41.9646 39C41.1068 38.7379 40.2488 38.4401 39.3904 38.1066C38.7393 37.6971 38.1008 37.2699 37.4748 36.8247C34.0746 38.1961 30.7222 38.0278 27.4176 36.3197C26.3608 35.697 25.383 34.9201 24.4843 33.989C24.1916 33.6483 23.9322 33.2727 23.7061 32.8625C26.6171 31.6288 29.1613 29.6347 31.3387 26.8805C33.1331 24.4509 34.3004 21.5764 34.8408 18.257C34.9103 17.7425 34.9502 17.2246 34.9605 16.7032C37.8854 17.1444 40.3497 18.75 42.3537 21.5199C43.3304 23.0315 43.8791 24.7666 43.9999 26.7251ZM36.3374 19.1892C38.8471 19.9031 40.7129 21.7158 41.9346 24.6275C42.678 27.133 42.3787 29.4119 41.0367 31.4641C40.416 32.2438 39.7775 32.9949 39.121 33.7171C38.9257 34.1937 38.766 34.6858 38.6421 35.1932C38.3757 34.8784 38.0763 34.6453 37.7442 34.494C34.4411 36.1021 31.1585 36.0374 27.8965 34.2998C27.5007 34.1207 27.1415 33.8618 26.819 33.5229C30.2387 31.4927 32.9227 28.3981 34.8707 24.239C35.5196 22.6316 36.0085 20.9483 36.3374 19.1892Z" fill="#FDFDFD" />
            </svg>
            <span>Обратиться в поддержку</span>
    </Link>
</>
            ) : (
                <div className={styles.referral_container}>
                    <div className={styles.referral_balance}>
                        <div className={styles.balance_card}>
                            <div className={styles.balance_amount}>{referralBalance} ₽</div>
                            <div className={styles.balance_title}>Реферальный баланс</div>
                        </div>
                    </div>
{/* <BalanceCard 
  balance={referralBalance} 
  title="Реферальный баланс" 
  currencySymbol="₽" 
/> */}
                    <div className={styles.referral_link_section}>
                        <p className={styles.section_title}>Ваша реферальная ссылка</p>
                        <div className={styles.referral_link_container}>
                            <div className={styles.link_wrapper}>
                                <input 
                                    type="text" 
                                    className={styles.link_input} 
                                    value={referralLink} 
                                    readOnly
                                />
                                <button 
                                    className={styles.copy_button} 
                                    onClick={() => copyToClipboard(referralLink)}
                                >
                                    {copyStatus ? copyStatus : 'Копировать'}
                                </button>
                            </div>
                            <div className={styles.link_description}>
                                Поделитесь ссылкой с друзьями и получайте 5% с их покупок
                            </div>
                            <div className={styles.link_description}>
                                Совет: снимайте ролики в Tiktok/Youtube Shorts на тематику игр сервиса, добавляя парусекундную рекламу сервиса, оставляя вашу реферальную ссылку в комментариях профиля.
                            </div>
                            <div className={styles.link_description}>
                                Переходите в наш телеграм канал, где будут находиться полезные рекламные инструменты, советы, а так же информация о выплатах.
                            </div>
                        </div>
                    </div>

                    <form className={styles.payment_form} onSubmit={handleSubmitRef(onReferralSubmit)}>
                        <p className={styles.section_title}>Данные для выплат:</p>
                        
                        <div className={styles.form_group}>
                            <label className={styles.form_label}>Банк для выплат:</label>
                            <select 
                                className={styles.select_bank}
                                {...registerRef("bank", { required: "Выберите банк" })}
                            >
                                <option value="">Выберите банк</option>
                                {banks.map((bank, index) => (
                                    <option key={index} value={bank}>{bank}</option>
                                ))}
                            </select>
                            {errorsRef.bank && <span className={styles.error_message}>{errorsRef.bank.message}</span>}
                        </div>

                        <Input 
                            title="Номер телефона"
                            icon={
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17 2H7C5.34315 2 4 3.34315 4 5V19C4 20.6569 5.34315 22 7 22H17C18.6569 22 20 20.6569 20 19V5C20 3.34315 18.6569 2 17 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M12 18H12.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            }
                            {...registerRef("phone", { 
                                required: "Введите номер телефона",
                                pattern: {
                                    value: /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/,
                                    message: "Неверный формат номера"
                                }
                            })}
                            name="phone"
                            setValue={setValueRef}
                            value={watchRef().phone}
                            placeholder="+7 (999) 123-45-67"
                            editable={true}
                        />
                        {errorsRef.phone && <span className={styles.error_message}>{errorsRef.phone.message}</span>}

                        <PrimaryButton 
                            title={isReferralSubmitSuccessful ? "Сохранено" : "Сохранить данные"} 
                            type="submit"
                        />
                    </form>
{/* Обновленный код с JavaScript-решением для отображения иконок */}
<div className={styles.social_links_section}>
  <p className={styles.section_title}>Где вы продвигаете проект:</p>
  <div className={styles.social_links_form}>
    {socialInputs.map((input, index) => (
      <div key={input.id} className={styles.social_input_container}>
        <div className={styles.social_input_row}>
          {/* Используем кастомный контейнер с инлайн-стилями для управления иконкой */}
          <div className={styles.social_select_container}>
            <select 
              className={styles.social_select}
              value={input.type}
              onChange={(e) => updateSocialInput(input.id, 'type', e.target.value)}
              style={{
                backgroundImage: input.type ? 
                  `url("data:image/svg+xml,${getSocialIcon(input.type)}")` : 
                  `url("data:image/svg+xml,${getPlusIcon()}")`
              }}
            >
              <option value="">Выбрать</option>
              <option value="tiktok">TikTok</option>
              <option value="telegram">Telegram</option>
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
              <option value="vk">ВКонтакте</option>
            </select>
          </div>
          <input
            type="text"
            className={styles.social_link_input}
            placeholder="Вставьте ссылку"
            value={input.link}
            onChange={(e) => updateSocialInput(input.id, 'link', e.target.value)}
          />
          {socialInputs.length > 1 && (
            <button 
              type="button" 
              className={styles.remove_social_btn}
              onClick={() => removeSocialInput(input.id)}
              aria-label="Удалить"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    ))}
    <button 
      type="button" 
      className={styles.add_social_btn}
      onClick={addSocialInput}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span>Добавить еще</span>
    </button>
    
    <PrimaryButton 
      title={isSocialSubmitSuccessful ? "Сохранено" : "Сохранить соцсети"} 
      onClick={onSocialSubmit}
    />
  </div>
</div>
{/* <div className={styles.social_links_section}>
  <p className={styles.section_title}>Где вы продвигаете проект:</p>
  <div className={styles.social_links_form}>
    {socialInputs.map((input, index) => (
      <div key={input.id} className={styles.social_input_container}>
        <div className={styles.social_input_row}>
          <select 
            className={styles.social_select}
            value={input.type}
            onChange={(e) => updateSocialInput(input.id, 'type', e.target.value)}
          >
            <option value="">-</option>
            <option value="tiktok">TT</option>
            <option value="telegram">TG</option>
            <option value="youtube">YT</option>
            <option value="instagram">INST</option>
            <option value="vk">VK</option>

          </select> 
          <input
            type="text"
            className={styles.social_link_input}
            placeholder="Вставьте ссылку"
            value={input.link}
            onChange={(e) => updateSocialInput(input.id, 'link', e.target.value)}
          />
          {socialInputs.length > 1 && (
            <button 
              type="button" 
              className={styles.remove_social_btn}
              onClick={() => removeSocialInput(input.id)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    ))}
    <button 
      type="button" 
      className={styles.add_social_btn}
      onClick={addSocialInput}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span>Добавить еще</span>
    </button>
    
    <PrimaryButton 
      title={isSocialSubmitSuccessful ? "Сохранено" : "Сохранить соцсети"} 
      onClick={onSocialSubmit}
    />
  </div>
</div> */}

                    {referrals.length > 0 && (
                        <div className={styles.referrals_list_section}>
                            <p className={styles.section_title}>Ваши рефералы</p>
                            <div className={styles.referrals_list}>
                                {referrals.map((referral) => (
                                    <div key={referral.id} className={styles.referral_item}>
                                        <div className={styles.referral_info}>
                                            <div className={styles.referral_username}>{referral.name || referral.email}</div>
                                            <div className={styles.referral_date}>{referral.registration_date}</div>
                                        </div>
                                        <div className={styles.referral_profit}>
                                            {referral.total_spent ? `+${(referral.total_spent * 0.05).toFixed(0)} ₽` : '0 ₽'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}
