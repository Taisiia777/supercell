'use server'

export async function checkout(data: any, token?: string) {
    const res = await fetch(process.env.API_URL + "shop/checkout/", {
        method: "POST", // Перемещаем метод сюда
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        cache: "no-cache",
        body: JSON.stringify(data)
    });

    return await res.json();
}
