interface ProductImage {
    id: number;
    original: string;
    caption: string;
    display_order: number;
}

interface Product {
    id: number;
    title: string;
    images: ProductImage[];
    categories: string[];
    login_type: string;
}

interface ShippingAddress {
    first_name: string;
    last_name: string;
    district: string;
    line1: string;
    state: string;
    phone_number: string;
    date: string;
    time: string;
    notes: string;
}

interface Line {
    id: number;
    product: Product[];
    quantity: number;
    unit_price_incl_tax: string;
    line_price_incl_tax: string;
    measurement: string | null;
    login_data: {
        account_id: string;
        code: string;
    };
}

export interface IOrder {
    id: number;
    shipping_address: ShippingAddress;
    total_incl_tax: string;
    total_excl_tax: string;
    shipping_incl_tax: string;
    shipping_excl_tax: string;
    lines: Line[];
    number: string;
    currency: string;
    shipping_method: string;
    shipping_code: string;
    guest_email: string;
    date_placed: string;
    status: string;
    payment_link: string;
    payment_id: string;
    updated_dt: string;
    site: number;
    basket: number;
    user: number;
    billing_address: any;
    seller: number;
}

interface User {
    id: number;
    first_name: string;
    last_name: string;
    receiver: {
        name: string | null;
        phone: string | null;
    };
    delivery: {
        city: string | null;
        district: string | null;
        address: string | null;
        notes: string | null;
    };
}

export interface IOrderDetail {
    user: User;
    orders: IOrder[];
}
