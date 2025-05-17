'use client'
import {FC, useState} from "react";
import Link from "next/link";
import styles from "./nav.module.scss";
import { usePathname } from "next/navigation";
import NavIcon from "@/images/nav/catalog";

const Nav: FC = () => {
    const router = usePathname();
    const [activeRoute, setActiveRoute] = useState<string>(router ?? "/");

    const handleLinkClick = (href: string) => {
        setActiveRoute(href);
    };

    const nav = [
        {
            id: 1,
            href: "/",
            name: "Главная",
            svg: <NavIcon name="home" />,
        },
        {
            id: 2,
            href: "/catalog",
            name: "Каталог",
            svg: <NavIcon name="catalog" />,
        },
        {
            id: 3,
            href: "/cart",
            name: "Корзина",
            svg: <NavIcon name="cart" />,
        },
        {
            id: 4,
            href: "/profile",
            name: "Профиль",
            svg: <NavIcon name="profile" />,
        },
    ];

    return (
        <nav className={styles.nav}>
            {nav.map((item) => (
                <Link href={item.href} key={item.id} className={
                    router === item.href || (item.href !== "/" && router.startsWith(item.href))
                        ? `${styles.item} ${styles.animation}`
                        : styles.item
                }
                      onClick={() => handleLinkClick(item.href)}
                >
                    <div
                        className={
                            router === item.href || (item.href !== "/" && router.startsWith(item.href))
                                ? styles.active
                                : ""
                        }
                    >
                        {item.svg}
                    </div>
                    <div className={styles.name}>
                        <p
                            className={
                                router === item.href || (item.href !== "/" && router.startsWith(item.href))
                                    ? styles.hide
                                    : ""
                            }
                        >
                            {item.name}
                        </p>
                    </div>
                    <div className={styles.bg} style={router === item.href || (item.href !== "/" && router.startsWith(item.href)) ? {} : { display: "none" }}>
                        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M0 20.198C0 15.4312 3.3646 11.3271 8.03884 10.3922L48.0388 2.39223C54.2268 1.15465 60 5.88758 60 12.198V39.802C60 44.5688 56.6354 48.6729 51.9612 49.6078L11.9612 57.6078C5.77325 58.8454 0 54.1124 0 47.802V20.198Z"
                                fill={`url(#paint${item.id}_linear_1_234)`} // Unique ID for each item
                            />
                            <defs>
                                <linearGradient
                                    id={`paint${item.id}_linear_1_234`} // Unique ID for each item
                                    x1="3"
                                    y1="-3.18769e-07"
                                    x2="44.7906"
                                    y2="81.0429"
                                    gradientUnits="userSpaceOnUse"
                                >
                                    <stop stopColor="#375AAB" />
                                    <stop offset="1" stopColor="#2A3B67" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </Link>
            ))}
        </nav>
    );
};

export default Nav;
