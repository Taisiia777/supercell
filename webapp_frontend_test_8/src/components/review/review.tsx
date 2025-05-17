//@ts-nocheck
'use client'
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import styles from "./review.module.scss";
import PrimaryButton from "@/components/ui/primary-button/primary-button";
import { useTelegram } from "@/app/useTg";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import GoBack from "@/components/back/back";
import Header from "@/components/header/header";
import { usePendingOrder } from '@/components/store/pending-order-store';

// Интерфейсы для типизации
interface FormData {
    name: string;
    text: string;
    rating: number;
}

interface ReviewProps {
    order: string;
}

interface ApiResponse {
    status: boolean;
    message?: string;
}

export default function OrderReview({order}: {order: string}): JSX.Element {
    const router = useRouter();
    const [formData, setFormData] = useState<FormData>({
        name: '',
        text: '',
        rating: 5
    });
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [orderStatus, setOrderStatus] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    
    const { user, webApp } = useTelegram();
    const { clearPendingOrder } = usePendingOrder();

    useEffect(() => {

        clearPendingOrder();
    }, [clearPendingOrder]);

    useEffect(() => {
        // Если есть имя пользователя, подставляем его в форму
        if (user && user.first_name) {
            setFormData(prev => ({
                ...prev,
                name: user.first_name + (user.last_name ? ' ' + user.last_name : '')
            }));
        }

        // Проверяем статус заказа
        const checkOrderStatus = async () => {
            if (!order) return;
            
            try {
                const response = await fetch(`${process.env.API_URL}customer/order/${order}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': webApp?.initData ? `Bearer ${webApp.initData}` : '',
                    },
                    cache: 'no-cache'
                });
                
                if (!response.ok) throw new Error('Не удалось получить статус заказа');
                
                const data = await response.json();
                setOrderStatus(data.order?.status);
                setIsLoading(false);
                
                // Если заказ не выполнен, перенаправляем на страницу заказа
                if (data.order?.status !== 'DELIVERED') {
                    toast.error('Отзыв можно оставить только после получения заказа');
                    router.push(`/order/${order}`);
                }
            } catch (error) {
                console.error('Ошибка при проверке статуса заказа:', error);
                setIsLoading(false);
                toast.error('Не удалось загрузить информацию о заказе');
                router.push('/profile');
            }
        };

        checkOrderStatus();
    }, [user, order, router, webApp]);
    
    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleRatingChange = (rating: number): void => {
        setFormData(prev => ({
            ...prev,
            rating
        }));
    };
    
    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        
        try {
            // Формируем данные для отправки
            const reviewData = {
                rating: parseInt(formData.rating.toString()),
                comment: formData.text
            };
            
            // Отправляем отзыв на сервер
            const response = await fetch(`${process.env.API_URL}customer/order/${order}/review/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": webApp?.initData ? `Bearer ${webApp.initData}` : '',
                },
                body: JSON.stringify(reviewData)
            });
            
            const result: ApiResponse = await response.json();
            
            if (response.ok) {
                setSubmitted(true);
                toast.success('Спасибо за ваш отзыв!');
            } else {
                const errorMessage = result.message || 'Ошибка при отправке отзыва';
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error('Ошибка при отправке отзыва:', error);
            toast.error('Произошла ошибка при отправке. Пожалуйста, попробуйте позже.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <p>Загрузка...</p>
            </div>
        );
    }

    // Если заказ не в статусе DELIVERED, не показываем форму отзыва
    if (orderStatus !== 'DELIVERED') {
        return null;
    }

    return (
        <>
            <Header title="Отзыв о заказе" />
            <GoBack />
            <div className={styles.review_container}>
                <div className={styles.review_form}>
                    {!submitted ? (
                        <>
                            <h3>Оставьте отзыв о вашем заказе #{order}</h3>
                            <form onSubmit={handleSubmit}>
                                <div className={styles.input_group}>
                                    <label htmlFor="name">Ваше имя</label>
                                    <input 
                                        type="text" 
                                        id="name" 
                                        name="name" 
                                        value={formData.name} 
                                        onChange={handleInputChange} 
                                        placeholder="Введите ваше имя"
                                        required 
                                        disabled={isSubmitting}
                                    />
                                </div>
                                
                                <div className={styles.rating_select}>
                                    <label>Ваша оценка</label>
                                    <div className={styles.stars}>
                                        {[5, 4, 3, 2, 1].map((star) => (
                                            <React.Fragment key={star}>
                                                <input 
                                                    type="radio" 
                                                    id={`star${star}`} 
                                                    name="rating" 
                                                    value={star} 
                                                    checked={parseInt(formData.rating.toString()) === star}
                                                    onChange={() => handleRatingChange(star)}
                                                    disabled={isSubmitting}
                                                />
                                                <label htmlFor={`star${star}`}>★</label>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className={styles.input_group}>
                                    <label htmlFor="text">Ваш отзыв</label>
                                    <textarea 
                                        id="text" 
                                        name="text" 
                                        value={formData.text} 
                                        onChange={handleInputChange} 
                                        placeholder="Расскажите о вашем опыте покупки"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                                
                                <div className={styles.submit_btn}>
                                    <PrimaryButton 
                                        title={isSubmitting ? "Отправка..." : "Отправить отзыв"} 
                                        type="submit" 
                                    />
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className={styles.thank_you}>
                            <div className={styles.check_icon}>
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 12L10 17L19 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <h3>Спасибо за ваш отзыв!</h3>
                            <p>Мы ценим ваше мнение и используем его для улучшения нашего сервиса.</p>
                            <div className={styles.go_profile}>
                                <PrimaryButton 
                                    title="В профиль" 
                                    type="button"
                                    onClick={() => router.push('/profile')}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}