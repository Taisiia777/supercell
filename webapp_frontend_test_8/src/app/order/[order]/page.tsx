import Header from "@/components/header/header";
import GoBack from "@/components/back/back";
import Order from "@/components/order_detail/order_detail";
import {getOrder} from "@/actions/getOrder";

export default async function OrderPage({ params } : { params: { order: string } }) {

    //const order = await getOrder(params.order)

    return (
        <>
            <Header title="Мои заказы"/>
            <GoBack/>
            {/*<Order data={order}/>*/}
            <Order id={params.order}/>
        </>
    )
}