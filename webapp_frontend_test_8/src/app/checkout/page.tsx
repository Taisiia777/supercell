import Header from "@/components/header/header";
import GoBack from "@/components/back/back";
import CheckOut from "@/components/checkout/checkout";
import {getProducts} from "@/actions/getProducts";

export default async function CheckOutPage() {

    const products = await getProducts()

    return (
        <>
            <Header title="Оформление"/>
            <GoBack/>
            <CheckOut data={products}/>
        </>
    )
}