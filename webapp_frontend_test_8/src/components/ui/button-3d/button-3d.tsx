import {IBtn3d} from "@/types/btn.interface";
import styles from "./btn.module.scss"
import Link from "next/link";

export default function Button3D(props: IBtn3d) {
    return (
        <div className={styles.btn3d}>
            {props.href ? (
                <Link href={props.href} className={styles.btn}>
                    <span>{props.name}
                    </span></Link>
            ) : (
                <button type="button" className={styles.btn}><span>{props.name}</span></button>
            )}
        </div>
    )
}