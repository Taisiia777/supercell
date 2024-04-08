import styles from "./success.module.scss"
import success from "@/images/success.png"
import success_bg from "@/images/success_bg.png"
import PrimaryButton from "@/components/ui/primary-button/primary-button";
import Link from "next/link";
import Image from "next/image";
export default function Success(props: {order: string}) {

    return (
        <div className={styles.success}>
            <div className={styles.container}>
                <h2>Успешная покупка</h2>
                <div className={styles.img}>
                    <Image src={success} alt="success" height={125} width={131}/>
                </div>
                <p>В профиле вы сможете отслеживать
                    статус вашего заказа № <span>{props.order}</span>
                </p>
            </div>
            <div className={styles.bg}>
                <Image src={success_bg} alt="success" height={206} width={301}/>
            </div>
            <div className={styles.go_profile}>
                <Link href={'/profile'}>
                    <PrimaryButton title="В профиль" type="button"/>
                </Link>
            </div>
        </div>
    )
}