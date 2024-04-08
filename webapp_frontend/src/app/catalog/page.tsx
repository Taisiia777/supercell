import Header from "@/components/header/header";
import Products from "@/components/catalog/products";
import {getProducts} from "@/actions/getProducts";

export default async function CatalogPageAll() {

    const products = await getProducts()

    return (
        <>
            <Header/>
            <Products data={products}/>
        </>
    )
}