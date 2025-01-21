export interface IPrimaryButton {
    title: string
    subtitle?: string
    maxWidthValue?: number
    onClick?: () => void
    type: "button" | "submit"
    disabled?: boolean
    style?: React.CSSProperties
}