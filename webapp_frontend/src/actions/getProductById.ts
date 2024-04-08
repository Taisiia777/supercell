export async function getProductById(id: string) {
    const res = await fetch(process.env.API_URL + "shop/product/" +id, {
        headers: {
            method: "GET"
        },
        cache: "no-cache"
    })

    return await res.json()
}