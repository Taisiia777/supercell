import Header from "@/components/header/header";
import {getProductById} from "@/actions/getProductById";
import GoBack from "@/components/back/back";
import Product from "@/components/product/product";

export default async function ProductPage({ params } : { params: { id: string } }) {

    const product = await getProductById(params.id)

    return (
        <>
            <Header/>
            <GoBack/>
            <Product data={product}/>
        </>
    )
}