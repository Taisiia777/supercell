import {IProduct} from "@/types/products.interface";

export interface CartState {
    items: CartItem[]
    // addItem: (id: number, game: string) => void
    addItem: (id: number, game: string, loginType?: string) => boolean

    removeItem: (id: number) => void
    removeArchived: (id: number) => void
    removeItemBack: (id: number) => void
    getTotalCount: () => number
    removeAll: () => void
    isItemAddedToCart: (productId: number) => boolean;
    getItemQuantity: (productId: number) => number;
    addProductData: (productsData: { productId: string; loginType: "EMAIL_CODE" | "LINK" | "URL_EMAIL" | "URL_LINK" | string; value: string, email: string }[]) => void
    updateCode: any
}

interface UpdateProduct {
    productId: number;
    type: "account_id" | "link" | "code";
    value: string;
}

export interface IOrderData {
    email: string
    setEmail: (email: string) => void
}

export type CartItem = {
    id: number
    count: number
    account_id?: string
    link?: string
    code?: string
    email?: string
    game: string
    type?: "LINK" | "EMAIL_CODE" | "URL_EMAIL" | "URL_LINK"
    friendUrl?: string; // Добавляем поле для хранения URL друга

}
