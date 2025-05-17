import Header from "@/components/header/header";
import GoBack from "@/components/back/back";
import Orders from "@/components/orders/orders";
import Button3D from "@/components/ui/button-3d/button-3d";
import {getOrders} from "@/actions/getOrders";

export default async function OrdersPage() {
    //const orders = await getOrders()

    return (
        <>
            <Header component={
                <Button3D name="Мой профиль" href="/profile"/>
            }/>
            <GoBack/>
            {/*<Orders data={orders}/>*/}
            <Orders/>
        </>
    )
}