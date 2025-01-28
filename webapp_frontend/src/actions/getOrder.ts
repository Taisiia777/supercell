export async function getOrder(order: string) {


    const res = await fetch(process.env.API_URL + "customer/order/" + order, {
        headers: {
            method: "GET",
            "Content-Type": "application/json",
            // "Authorization": `Bearer ${token}`
        },
        cache: "no-cache",
    })

    return await res.json()
}