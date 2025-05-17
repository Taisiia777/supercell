export interface IProduct {
    id: number
    url: string
    title: string
    description?: string
    images: IProductImage[]
    price: IProductPrice
    categories: string[]
    seller: IProductSeller
    login_type: "EMAIL_CODE" | "LINK" | "URL_EMAIL" | "URL_LINK"
    count?: number
    account_id?: string
    code?: string
    link?: string
    game: string
    filters_type?: string
    friendUrl?: string; 

}
interface IProductImage {
    id: number
    code?: string
    original: string
    caption?: string
    display_order?: number
    date_created?: string
}
interface IProductPrice {
    currency: string
    incl_tax: string
    old_price?: string
    measurement?: string
}
interface IProductSeller {
    id: number
    name: string
    image?: string
    products_url?: string
}