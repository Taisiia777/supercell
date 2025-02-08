'use client'
import styles from "./orders.module.scss"
import {formatDate} from "@/utils/formatDate";
import Link from "next/link";
import {IOrders} from "@/types/orders.interface";
import {useEffect, useState} from "react";
import {useTelegram} from "@/app/useTg";
export default function Orders() {
    const { user, webApp } = useTelegram();

    const [getorders, setOrders] = useState<IOrders>()

    const [isLoading, setLoading] = useState(true)

    useEffect(() => {
        if(user && webApp && webApp.initData) {
            fetch(process.env.API_URL + "customer/orders/", {
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
                        setOrders(data)
                        

                        setLoading(false)
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        }
    }, [user]);

    return (
        <div className={styles.orders}>
            <div className={styles.items}>
                {getorders && getorders.orders && getorders.orders.map((order) => (
                    <Link href={`/order/${order.number}`} className={styles.item} key={order.id}>
                        <div className={styles.container}>
                            <div className={styles.number}>
                                <span>ЗАКАЗ № {order.number}</span>
                                {/*<Image src={img3} alt="" height={20} width={20}/>*/}
                            </div>
                            <div className={styles.data}>
                                ДАТА: {formatDate(order.date_placed)} СУММА: {order.total_incl_tax} ₽
                            </div>
                        </div>
                        <div className={styles.route}>

                            <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="0.00244141" width="24" height="24" rx="5" fill="url(#paint0_linear_35_2230)"/>
                                <rect x="0.252441" y="0.25" width="23.5" height="23.5" rx="4.75" stroke="url(#paint1_linear_35_2230)" strokeOpacity="0.6" strokeWidth="0.5" style={{mixBlendMode: "overlay"}}/>
                                <path d="M19.9615 12.1141C19.9556 11.4893 19.6988 10.892 19.2467 10.4516L14.0492 5.34532C13.8222 5.12414 13.5152 5 13.1951 5C12.875 5 12.568 5.12414 12.341 5.34532C12.2274 5.45571 12.1373 5.58705 12.0758 5.73176C12.0143 5.87646 11.9826 6.03168 11.9826 6.18844C11.9826 6.3452 12.0143 6.50042 12.0758 6.64512C12.1373 6.78983 12.2274 6.92117 12.341 7.03156L16.3269 10.9266H4.21154C3.89022 10.9266 3.58206 11.0517 3.35485 11.2744C3.12764 11.4971 3 11.7991 3 12.1141C3 12.429 3.12764 12.731 3.35485 12.9537C3.58206 13.1764 3.89022 13.3016 4.21154 13.3016H16.3269L12.341 17.2084C12.1128 17.4305 11.984 17.7322 11.9829 18.0474C11.9817 18.3625 12.1084 18.6651 12.3349 18.8887C12.5614 19.1123 12.8693 19.2386 13.1908 19.2397C13.5123 19.2408 13.8211 19.1167 14.0492 18.8947L19.2467 13.7884C19.7018 13.3451 19.9588 12.7429 19.9615 12.1141Z" fill="white"/>
                                <defs>
                                    <linearGradient id="paint0_linear_35_2230" x1="1.20244" y1="-1.27508e-07" x2="17.9187" y2="32.4172" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#2A3B67"/>
                                        <stop offset="0.635" stopColor="#4578EE"/>
                                        <stop offset="1" stopColor="#2A3B67"/>
                                    </linearGradient>
                                    <linearGradient id="paint1_linear_35_2230" x1="0.00244141" y1="0" x2="13.6325" y2="28.8921" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="white"/>
                                        <stop offset="1"/>
                                    </linearGradient>
                                </defs>
                            </svg>

                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
