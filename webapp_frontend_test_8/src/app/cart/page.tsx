import Header from "@/components/header/header";
import Cart from "@/components/cart/cart";
import GoBack from "@/components/back/back";
import {getProducts} from "@/actions/getProducts";
import {getProfile} from "@/actions/getProfile";

export default async function CartPage() {
    const products = await getProducts()

    return (
        <>
            <Header title="Корзина"/>
            <GoBack/>
            <Cart data={products}/>
        </>
    )
}