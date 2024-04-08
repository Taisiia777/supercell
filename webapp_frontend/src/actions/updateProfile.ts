'use server'
import {revalidatePath} from "next/cache";

export async function updateProfile(data: any, token?: any) {

    const emails = {
        brawl_stars: data.brawl_stars,
        clash_of_clans: data.clash_of_clans,
        clash_royale: data.clash_royale,
        stumble_guys: data.stumble_guys
    }

    const res = await fetch(process.env.API_URL + "customer/me", {
        method: "PATCH", // Перемещаем метод сюда
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        cache: "no-cache",
        body: JSON.stringify({game_email: emails})
    });

    revalidatePath("/cart")
    revalidatePath("/profile")

    return await res.json();
}
