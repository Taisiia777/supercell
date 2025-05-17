// import Header from "@/components/header/header";
// import Products from "@/components/catalog/products";
// import {getProducts} from "@/actions/getProducts";

// export default async function CatalogPageAll() {

//     const products = await getProducts()
//     return (
//         <>
//             <Header/>
//             <Products data={products}/>
//         </>
//     )
// }
// /catalog/page.tsx (серверный компонент)
import Header from "@/components/header/header";
import Products from "@/components/catalog/products";
import {getProducts} from "@/actions/getProducts";

export default async function CatalogPageAll() {
    // Получаем данные на сервере
    const products = await getProducts();

    return (
        <>
            <Header/>
            <Products data={products}/>
        </>
    );
}