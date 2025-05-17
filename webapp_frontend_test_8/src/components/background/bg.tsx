import styles from "./bg.module.scss"
function Background() {
    return (
        <div className={styles.bg}>
            <svg width="390" height="695" viewBox="0 0 390 695" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M242.5 167.5L322 0L393.5 59.5V720.5L-20 705L242.5 167.5Z" fill="url(#paint0_linear_226_19)" />
                <defs>
                    <linearGradient id="paint0_linear_226_19" x1="168.5" y1="0.500004" x2="372.499" y2="720.5" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#375AAB" />
                        <stop offset="1" stopColor="#2A3B67" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    )
}

export default Background