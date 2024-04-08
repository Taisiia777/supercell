import Header from "@/components/header/header";
import {getPopularProducts} from "@/actions/getPopular";
import Popular from "@/components/popular/popular";
import Background from "@/components/background/bg";
import Hero from "@/components/hero/hero";
import CategoriesMini from "@/components/categories-mini/categories-mini";

export default async function Home() {
    const popular = await getPopularProducts();

    return (
        <>
            <Header/>
            <Hero/>
            <CategoriesMini/>
            <Popular data={popular}/>
            <Background/>
        </>
    );
}
