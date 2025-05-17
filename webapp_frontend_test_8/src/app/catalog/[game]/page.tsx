import {getProductsByCategory} from "@/actions/getProductsByCategory";
import Header from "@/components/header/header";
import Products from "@/components/catalog/products";

export default async function CatalogPage({ params } : { params: { game: string } }) {

    const products = await getProductsByCategory(params.game)

    return (
        <>
            <Header/>
            <Products data={products}/>
        </>
    )
}