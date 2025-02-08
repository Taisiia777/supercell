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
import {getProfile} from "@/actions/getProfile";
import Link from "next/link";
import ProfileOrders from '../ProfileOrders/ProfileOrders';  // Add this import at the top
import InputId from "../InputId/InputId";
//export default function Profile(props: { data: IProfile }) {
export default function Profile() {
    const { user, webApp } = useTelegram();
    const [profile, setProfile] = useState()
    const [profileData, setProfileData] = useState({
        brawl_stars: '',
        clash_of_clans: '',
        clash_royale: '',
        hay_day: ''
    });
    const [isLoading, setLoading] = useState(true)
    const [formErrors, setFormErrors] = useState({});

    // Функция валидации email
    const validateEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !email || emailRegex.test(email);
    };
  
  const handleUpdateEmail = async (field: string, value: string) => {
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
      console.error('Error updating profile:', error);
      return false;
    }
  };
  
  useEffect(() => {
    const fetchProfileData = async () => {
        if (user && webApp?.initData) {
            try {
                const response = await fetch(process.env.API_URL + "customer/me/", {
                    headers: {
                        'Authorization': `Bearer ${webApp.initData}`,
                    },
                });
                const data = await response.json();
                setProfile(data);
                
                // Устанавливаем начальные значения в инпуты
                if (data && data.game_email) {
                    setInputValue('brawl_stars', data.game_email.brawl_stars || '');
                    setInputValue('clash_of_clans', data.game_email.clash_of_clans || '');
                    setInputValue('clash_royale', data.game_email.clash_royale || '');
                    setInputValue('hay_day', data.game_email.hay_day || '');
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    fetchProfileData();
}, [user, webApp?.initData]);

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm();

    const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);



    useEffect(() => {
        if(profile && profile.game_email) {
            setValue("brawl_stars", profile.game_email.brawl_stars)
            setValue("clash_of_clans", profile.game_email.clash_of_clans)
            setValue("clash_royale", profile.game_email.clash_royale)
            setValue("hay_day", profile.game_email.hay_day)
        }

    }, [profile]);




    const clearEmail = async (field: string) => {
        // Create an object that keeps existing values and only clears the specified field
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
            console.error('Error clearing email:', error);
        }
    };
    

    return (
        <div className={styles.profile}>

                <form className={styles.form}>


                    {/* <Input title="ID ВАШЕГО ПРОФИЛЯ" value={user?.id ?? ''} copy="true" name="id" background={true}/> */}
                    <InputId title="ID ВАШЕГО ПРОФИЛЯ" value={user?.id ?? ''} name="id" background={true}/>
                    <p><svg xmlns="http://www.w3.org/2000/svg" width="32" height="28" viewBox="0 0 43 38" fill="none">
  <rect x="6.32373" y="5.60498" width="30.2835" height="26.7893" rx="8.60124" fill="black"/>
  <path fill="white" d="M13.4914 11.0942V27.2645H16.7975V11.0942H13.4914ZM30.7922 14.3283C30.7205 14.0588 30.5682 13.7623 30.3352 13.4389C30.1381 13.1694 29.8604 12.855 29.502 12.4957C29.1615 12.1363 28.8479 11.8578 28.5612 11.6602C28.2387 11.4266 27.943 11.2739 27.6742 11.202C27.4054 11.1302 27.0739 11.0942 26.6797 11.0942H18.616V27.2645H26.6797C27.0739 27.2645 27.4054 27.2285 27.6742 27.1567C27.943 27.0848 28.2387 26.9321 28.5612 26.6985C28.83 26.5188 29.1436 26.2493 29.502 25.89C29.8604 25.5306 30.1381 25.2072 30.3352 24.9198C30.5682 24.5964 30.7205 24.2999 30.7922 24.0304C30.8638 23.7609 30.8997 23.4285 30.8997 23.0333V15.3254C30.8997 14.9302 30.8638 14.5978 30.7922 14.3283ZM27.1635 14.7056C27.4681 15.011 27.6205 15.1907 27.6205 15.2446V23.1141C27.6205 23.168 27.4681 23.3477 27.1635 23.6531C26.8589 23.9585 26.6797 24.1113 26.6259 24.1113H21.8953V14.2474H26.6259C26.6797 14.2474 26.8589 14.4002 27.1635 14.7056Z"/>
</svg> Привязанные почты Supercell ID</p>
                    <Input title="Почта clash_royale" icon={
                        <Image src={img4} alt="" height={35} width={35} style={{borderRadius:"5px"}}/>
                    }
                           {...register("clash_royale")}
                           name="clash_royale"
                           setValue={setValue}
                           value={watch().clash_royale}
                           rotate={true}
                           onClear={() => clearEmail('clash_royale')}
                           onUpdate={(value) => handleUpdateEmail('clash_royale', value)}
                           editable={true} // добавляем флаг редактирования
                           clearable={true} // добавляем возможность очистки
                           validation="email"

                    />

                    <Input title="Почта brawl_stars" icon={
                        <Image src={img2} alt="" height={35} width={35} style={{borderRadius:"5px"}}/>
                    }
                           {...register("brawl_stars")}
                           name="brawl_stars"
                           setValue={setValue}
                           value={watch().brawl_stars}
                           rotate={true}
                           onClear={() => clearEmail('brawl_stars')}
                           onUpdate={(value) => handleUpdateEmail('brawl_stars', value)}
                           validation="email"

                           editable={true} // добавляем флаг редактирования
                           clearable={true} // добавляем возможность очистки
                    />

                    <Input title="Почта clash_of_clans" icon={
                        <Image src={img3} alt="" height={35} width={35} style={{borderRadius:"5px"}}/>
                    }
                           {...register("clash_of_clans")}
                           name="clash_of_clans"
                           setValue={setValue}
                           value={watch().clash_of_clans}
                           rotate={true}
                           onClear={() => clearEmail('clash_of_clans')}
                           onUpdate={(value) => handleUpdateEmail('clash_of_clans', value)}
                           validation="email"

                           editable={true} // добавляем флаг редактирования
                           clearable={true} // добавляем возможность очистки
                    />

                    <Input title="Почта stamble guys" icon={
                        <Image src={img5} alt="" height={35} width={35} style={{borderRadius:"5px"}}/>
                    }
                           {...register("hay_day")}
                           name="hay_day"
                           setValue={setValue}
                           value={watch().hay_day}
                           rotate={true}
                           onClear={() => clearEmail('hay_day')}
                           onUpdate={(value) => handleUpdateEmail('hay_day', value)}
                           validation="email"

                           editable={true} // добавляем флаг редактирования
                           clearable={true} // добавляем возможность очистки
                    />

                    {/* <PrimaryButton title={isSubmitSuccessful ? 'Отправлено' : 'Сохранить'} type="submit"/> */}

                </form>
                <ProfileOrders />

            </div>
    )
}
