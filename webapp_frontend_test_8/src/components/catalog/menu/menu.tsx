
'use client'
import styles from "./menu.module.scss";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

import img2 from "@/images/categories_mini/image2.png";
import img3 from "@/images/categories_mini/image3.png";
import img4 from "@/images/categories_mini/image1.png";
import img5 from "@/images/categories_mini/image4.png";
import NavIcon from "@/images/nav/catalog";

interface Items {
    id: number
    name: string
    href: string
    img?: any
    icon?: any
    height?: number
    width?: number
}

export default function CatalogMenu() {
    const router = usePathname();

    const items = [
        {id: 1, href: "/catalog", name: "Каталог\nтоваров", icon: <NavIcon name="catalog"/>},
        {id: 2, href: "/catalog/3", name: "Clash\nRoyale", img: img4, height: 22, width: 20},
        {id: 3, href: "/catalog/1", name: "Brawl\nStars", img: img2, height: 20, width: 20},
        {id: 4, href: "/catalog/2", name: "Clash of\nClans", img: img3, height: 20, width: 20},
        {id: 5, href: "/catalog/4", name: "Hay\nDay", img: img5, height: 20, width: 20}
    ]

    return (
        <div className={styles.nav}>
            <div className={styles.items}>
                {items.map((item: Items) => (
                    <Link href={item.href} key={item.id} className={
                        router === item.href || (item.href !== "/catalog" && router.startsWith(item.href))
                            ? `${styles.item} ${styles.active}`
                            : styles.item
                    }>
                    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="50" height="50" rx="10" fill={`url(#paint${item.id}_linear_1_175)`}/>
                        <rect x="0.5" y="0.5" width="49" height="49" rx="9.5" stroke={`url(#paint1${item.id}_linear_1_175)`} strokeOpacity="0.2"/>
                        <defs>
                            <linearGradient id={`paint${item.id}_linear_1_175`} x1="18.0303" y1="13.278" x2="23.3926" y2="43.6412" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#353F54"/>
                                <stop offset="1" stopColor="#222834"/>
                            </linearGradient>
                            <linearGradient id={`paint1${item.id}_linear_1_175`} x1="5.60606" y1="1.86722" x2="34.8664" y2="30.5229" gradientUnits="userSpaceOnUse">
                                <stop stopColor="white"/>
                                <stop offset="0.844522"/>
                                <stop offset="1"/>
                            </linearGradient>
                        </defs>
                    </svg>
                        {item.img ? (
                            <Image 
                                src={item.img} 
                                alt={item.name} 
                                height={48} // Увеличим размер
                                width={48}  // Увеличим размер
                                quality={100} // Максимальное качество
                                priority={true} // Приоритетная загрузка
                                unoptimized={true} // Отключаем оптимизацию Next.js
                            />
                        ) : (
                            <div className={styles.icon}>
                                {item.icon}
                            </div>
                        )}
                        <p>{item.name}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}