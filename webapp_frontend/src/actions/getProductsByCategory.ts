export async function getProductsByCategory(id: string) {
    const res = await fetch(process.env.API_URL + "shop/products?category_id=" +id, {
        headers: {
            method: "GET"
        },
        cache: "no-cache"
    })

    return await res.json()
}