// 'use client'
// import styles from "./menu.module.scss";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import Image from "next/image";

// import img2 from "@/images/categories_mini/image2.png";
// import img3 from "@/images/categories_mini/image3.png";
// import img4 from "@/images/categories_mini/image1.png";
// import img5 from "@/images/categories_mini/image4.png";
// import NavIcon from "@/images/nav/catalog";

// interface Items {
//     id: number
//     name: string
//     href: string
//     img?: any
//     icon?: any
//     height?: number
//     width?: number
// }

// export default function CatalogMenu() {
//     const router = usePathname();

//     const items = [
//         {id: 1, href: "/catalog", name: "Все", icon: <NavIcon name="catalog"/>},
//         {id: 2, href: "/catalog/3", name: "Clash royale",img: img4, height: 22, width: 20},
//         {id: 3, href: "/catalog/1", name: "Brawl stars",img: img2, height: 20, width: 20},
//         {id: 4, href: "/catalog/2", name: "Clash of clans",img: img3, height: 20, width: 20},
//         {id: 5, href: "/catalog/4", name: "hay day",img: img5, height: 20, width: 20}
//     ]

//     return (
//         <div className={styles.nav}>
//             <div className={styles.items}>
//                 {items.map((item: Items ) => (
//                     <Link href={item.href} key={item.id} className={
//                         router === item.href || (item.href !== "/catalog" && router.startsWith(item.href))
//                             ? `${styles.item} ${styles.active}`
//                             : styles.item
//                     }>
//                         {item.img ? (
//                             <Image src={item.img} alt={item.name} height={item.height ?? 16} width={item.width ?? 16} style={{borderRadius:"5px"}}/>
//                         ) : (
//                             <div className={styles.icon}>
//                                 {item.icon}
//                             </div>
//                         )}
//                         <p>{item.name}</p>
//                     </Link>
//                 ))}
//             </div>
//         </div>
//     )
// }
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
                        {item.img ? (
                            // <Image 
                            //     src={item.img} 
                            //     alt={item.name} 
                            //     height={item.height ?? 16} 
                            //     width={item.width ?? 16}
                            // />
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