export async function getProducts() {
    const res = await fetch(process.env.API_URL + "shop/products", {
        headers: {
            method: "GET"
        },
        cache: "no-cache"
    })
    
    return await res.json()
}