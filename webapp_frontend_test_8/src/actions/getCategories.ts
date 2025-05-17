export async function getCategories() {
    const res = await fetch(process.env.API_URL + "shop/categories", {
        headers: {
            method: "GET"
        }
    })

    return await res.json()
}