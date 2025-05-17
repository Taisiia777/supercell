import styles from "./hero.module.scss"
import bg from "@/images/herobg5.png"
import Image from "next/image"

function Hero() {
    return (
        <div className={styles.hero}>
            <div className={styles.msg}>
                Добро пожаловать в сервис внутриигровых покупок - Mamostore!
            </div>
            <div className={styles.img}>
                <Image 
                    src={bg}
                    alt="Hero background"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 372px"
                    className={styles.hero_bg}
                />
                <div className={styles.hero_img_container}>
                    {/* старый контент здесь */}
                </div>
            </div>
        </div>
    )
}

export default Hero
