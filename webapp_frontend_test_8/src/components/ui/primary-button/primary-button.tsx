'use client'
import styles from "./primary.module.scss"
import {IPrimaryButton} from "@/types/primary-btn.interface";

export default function PrimaryButton(props: IPrimaryButton) {
    const handleClick = () => {
        if(props.onClick) {
            props.onClick()
        }
    }

    return (
        <div className={styles.primary} style={{maxWidth: props?.maxWidthValue}}>
            <button type={props.type ?? "button"} className={styles.btn} onClick={handleClick}>
                <p>{props.title}</p>
                {props.subtitle && <span>{props.subtitle}</span>}
            </button>
        </div>
    )
}