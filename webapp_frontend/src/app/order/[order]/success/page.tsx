import Header from "@/components/header/header";
import GoBack from "@/components/back/back";
import Order from "@/components/order_detail/order_detail";
import Success from "@/components/success/success";
export default async function SuccessPage({ params } : { params: { order: string } }) {

    //const order = await getOrder(params.order)

    console.log(params.order)

    return (
        <>
            <Header title="Мои заказы"/>
            <GoBack/>
            <Success order={params.order}/>
        </>
    )
}