export interface IDavdamer {
    id: number;
    name: string;
    last_name: string;
    image: string;
}

export interface IProduct {
    categories: string[],
    id: number,
    images: {
        id: number,
        original: string
    }[],
    title: string,
    description: string,
    seller: {
        id: number,
        name: string,
        rating: string
    }
    orders_count: number,
    country: string,
    is_vegan: boolean,
    is_sugar_free: boolean,
    is_gluten_free: boolean,
    is_dietary: boolean,
    is_public: boolean,
    url: string,
    category: string[],
    location: string,
    price: {
        currency: string,
        incl_tax: string,
        measurement: string,
        old_price: string | null,
    },
    login_type: string,
    sub_categories: {
        id: number,
        full_name: string,
        child: {
            name: string
        }
    }[]

}
export interface ICategoryAPI {
    id: number,
    name: string;
    full_name: string;
    children: {
        id: number,
        name: string
    }[]
}
export interface IAttrAPI {
    code: string,
    name: string
}
export interface IProductClassesAPI {
    slug: string,
    name: string
}


export type TStatusOrder = "NEW" | "PAID" | "PROCESSING" | "SENT" | "DELIVERED" | "REFUND" | "CANCELLED" | "READY"
export interface IOrder {
    id: number,
    payment_id: string,
    payment_link: string,
    shipping_address: {
        first_name: string,
        last_name: string,
        line1: string,
        state: string,
        phone_number: string,
        notes: string,
        time: string,
        date: string,
        district: string
    },

    seller: {
        id: number,
        name: string,
        rating: string
    },
    user: {
        id: number,
        first_name: string,
        last_name: string,
        delivery: {
            address: string,
            first_name: string,
            last_name: string,
            id: number,
            district: string,
            notes: string
        }
        receiver: {
            name: string,
            phone: string
        }
    },
    number: string,
    currency: string,
    total_incl_tax: string,
    shipping_method: string,
    shipping_code: string,
    guest_email: string,
    date_placed: Date,
    status: string,
    updated_dt: Date,
    site: number,
    basket: number,
    billing_address: null | string
    statusName: string,

}

export interface IOrderInfo extends IOrder {
    lines: {
        id: number,
        product: IProduct,
        quantity: number,
        unit_price_incl_tax: string,
        measurement: string,
        login_data: {
            account_id: string,
            code: string
        },
    }[]
}
interface IStatusOrder {
    [key: string]: string
}
export const statusOrder: IStatusOrder = {
    NEW: "Ожидает оплаты",
    PAID: "Оплачен. Ожидает обработки",
    PROCESSING: "Оплачен. В процессе обработки",
    DELIVERED: "Завершен",
    CANCELLED: "Отменен",
}

export const statusOrderColor: IStatusOrder = {
    NEW: "#8D989E",
    PAID: "#B37B00",
    PROCESSING: "#FFC448",
    DELIVERED: "#004B2A",
    REFUND: "#9B2D30",
    CANCELLED: "#D24950",
    READY: "#D4E0FA"
}


export interface IGkAPI {
    id: number;
    name: string;
}