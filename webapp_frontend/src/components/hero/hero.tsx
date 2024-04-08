import styles from "./hero.module.scss"
import bg from "@/images/herobg5.png"

function Hero() {
    return (
        <div className={styles.hero}>
            <div className={styles.msg}>
                Добро пожаловать в сервис внутриигровых покупок - Mamostore!
            </div>
            <div className={styles.img} style={{background: `url(${bg.src}) no-repeat`, backgroundSize: "contain"}}>
                <div className={styles.hero_img_container}>
                    {/*<Image src={hero} alt="MAMOSTORE" objectFit="contain" fill quality={100} unoptimized priority className={styles.hero_img}/>*/}
                </div>
            </div>
        </div>
    )
}

export default Hero
