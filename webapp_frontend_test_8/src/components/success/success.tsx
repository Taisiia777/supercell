
//@ts-nocheck
'use client'
import React, { useState, useEffect } from 'react';
import styles from "./success.module.scss";
import success from "@/images/success.png";
import success_bg from "@/images/success_bg1.png";
import PrimaryButton from "@/components/ui/primary-button/primary-button";
import Link from "next/link";
import Image from "next/image";
import { useTelegram } from "@/app/useTg";
import { usePendingOrder } from '@/components/store/pending-order-store';

export default function Success(props: {order: string}) {
    const [showAnimation, setShowAnimation] = useState(false);
    const { markRedirected } = usePendingOrder();
    const { user, webApp } = useTelegram();
    
    useEffect(() => {
        // Показываем анимацию после загрузки компонента
        setShowAnimation(true);
        
        // Отмечаем редирект на success, но не очищаем заказ полностью
       
        markRedirected('success');
        
    }, [ markRedirected]);

    return (
        <div className={styles.success}>
            <div className={styles.container}>
                <h2>Успешная покупка</h2>
                <div className={`${styles.check_icon} ${showAnimation ? styles.animate : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12L10 17L19 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
                <p>В профиле вы сможете отслеживать
                    статус вашего заказа № <span>{props.order}</span>
                </p>
            </div>
            <div className={styles.bg}>
                <Image src={success_bg} alt="success" height={206} width={301}/>
            </div>
            <div className={styles.actions}>
                <Link href={`/order/${props.order}`} className={styles.link_button}>
                    <PrimaryButton title="Перейти к заказу" type="button"/>
                </Link>
                
                <Link href={'/profile'} className={styles.profile_link}>
                    <span>Перейти в профиль</span>
                </Link>
            </div>
        </div>
    );

}