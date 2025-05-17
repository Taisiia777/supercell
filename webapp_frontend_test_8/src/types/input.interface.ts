interface InputInterface {
    title?: string
    icon?: any
    value?: string | number
    placeholder?: string
    copy?: boolean
    name?: string
    required?: boolean
    productId?: number
    handleEnd?: (data: { productId: number | undefined; type: string | undefined; error: string; value: string }) => void
    type?: "account_id" | "code" | "link"
    error?: boolean
    rest?: any
    editable?: boolean // новое
    clearable?: boolean // новое
    onClear?: () => void // новое
    onUpdate?: (value: string) => void

}