'use server'

import {revalidatePath} from "next/cache";

export async function updateLoginData(data: any, orderId: string, token?: string) {
    const res = await fetch(process.env.API_URL + "customer/order/" + orderId + "/login_data/", {
        method: "PATCH", // Перемещаем метод сюда
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        cache: "no-cache",
        body: JSON.stringify([data])
    });

    return await res.json();
}
