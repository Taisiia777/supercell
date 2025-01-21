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
                <Link href={`https://t.me/Mamosupport`} className={styles.support}>

                    <svg width="34" height="30" viewBox="0 0 44 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path opacity="0.975" fillRule="evenodd" clipRule="evenodd" d="M15.1456 0C16.1633 0 17.181 0 18.1987 0C22.0921 0.341725 25.6041 2.01204 28.7347 5.01096C30.8224 7.09878 32.2492 9.77906 33.015 13.0518C33.7262 16.9919 33.1875 20.6173 31.3987 23.9283C29.389 27.2843 26.8248 29.6538 23.7061 31.0369C19.4917 32.8023 15.2413 32.9707 10.9551 31.5418C10.1748 32.0752 9.41654 32.6578 8.68028 33.2898C7.00678 34.3374 5.25078 35.0496 3.41225 35.4263C3.00281 35.4283 2.87311 35.1952 3.02313 34.7271C4.50449 33.0316 5.33261 30.908 5.50749 28.3566C3.19356 26.4025 1.52734 23.7611 0.508844 20.4323C0.273243 19.5358 0.103629 18.6294 0 17.7131C0 16.755 0 15.7968 0 14.8386C0.570309 10.6663 2.16668 7.31268 4.78912 4.77789C7.89606 1.94468 11.3482 0.352053 15.1456 0ZM15.385 2.09761C18.9906 1.83279 22.4028 2.75211 25.6218 4.85558C27.3048 6.04617 28.7515 7.6129 29.9619 9.55578C32.3486 14.1321 32.3087 18.664 29.8422 23.1514C27.6431 26.3865 24.9193 28.5489 21.6708 29.6384C17.9856 30.7816 14.324 30.6651 10.6857 29.2888C10.5066 29.3467 10.337 29.4374 10.1769 29.5608C9.15859 30.5069 8.08104 31.3356 6.94422 32.0468C6.77355 32.1717 6.59396 32.2235 6.40545 32.2022C6.90615 30.7037 7.20547 29.137 7.30341 27.502C6.64023 26.8245 5.96179 26.1642 5.26803 25.5209C3.9791 24.1041 2.97139 22.4079 2.2449 20.4323C1.15928 16.7965 1.43864 13.3522 3.083 10.0996C4.6251 7.3484 6.6106 5.31554 9.03946 4.001C11.0857 2.93413 13.201 2.29966 15.385 2.09761Z" fill="#FDFDFD" />
                        <path opacity="0.975" fillRule="evenodd" clipRule="evenodd" d="M43.9999 26.7251C43.9999 26.9582 43.9999 27.1912 43.9999 27.4243C43.7605 30.3635 42.7229 32.7071 40.887 34.4552C40.6952 34.6781 40.5256 34.924 40.3782 35.1932C40.3409 35.6153 40.4407 35.9779 40.6775 36.2809C41.2562 36.9801 41.8348 37.6793 42.4135 38.3785C42.5397 38.6015 42.5297 38.8086 42.3836 39C42.244 39 42.1042 39 41.9646 39C41.1068 38.7379 40.2488 38.4401 39.3904 38.1066C38.7393 37.6971 38.1008 37.2699 37.4748 36.8247C34.0746 38.1961 30.7222 38.0278 27.4176 36.3197C26.3608 35.697 25.383 34.9201 24.4843 33.989C24.1916 33.6483 23.9322 33.2727 23.7061 32.8625C26.6171 31.6288 29.1613 29.6347 31.3387 26.8805C33.1331 24.4509 34.3004 21.5764 34.8408 18.257C34.9103 17.7425 34.9502 17.2246 34.9605 16.7032C37.8854 17.1444 40.3497 18.75 42.3537 21.5199C43.3304 23.0315 43.8791 24.7666 43.9999 26.7251ZM36.3374 19.1892C38.8471 19.9031 40.7129 21.7158 41.9346 24.6275C42.678 27.133 42.3787 29.4119 41.0367 31.4641C40.416 32.2438 39.7775 32.9949 39.121 33.7171C38.9257 34.1937 38.766 34.6858 38.6421 35.1932C38.3757 34.8784 38.0763 34.6453 37.7442 34.494C34.4411 36.1021 31.1585 36.0374 27.8965 34.2998C27.5007 34.1207 27.1415 33.8618 26.819 33.5229C30.2387 31.4927 32.9227 28.3981 34.8707 24.239C35.5196 22.6316 36.0085 20.9483 36.3374 19.1892Z" fill="#FDFDFD" />
                    </svg>
                    <span>Обратиться в поддержку</span>
                </Link>
                <form className={styles.form}>


                    <Input title="ID ВАШЕГО ПРОФИЛЯ" value={user?.id ?? ''} copy="true" name="id" background={true}/>
                    <p>Привязанные почты Supercell ID</p>
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

            </div>
    )
}
