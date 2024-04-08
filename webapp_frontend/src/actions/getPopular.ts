export async function getPopularProducts() {
    const res = await fetch(process.env.API_URL + "shop/products/popular", {
        headers: {
            method: "GET"
        },
        cache: "no-cache"
    })

    return await res.json()
}