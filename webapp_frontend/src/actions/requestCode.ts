'use server'

export async function requestCode(data: any) {
    const res = await fetch(process.env.API_URL + "shop/request_code/", {
        method: "POST", // Перемещаем метод сюда
        headers: {
            "Content-Type": "application/json",
            // "Authorization": `Bearer ${token}`
        },
        cache: "no-cache",
        body: JSON.stringify({emails: data})
    });

    console.log({emails: data})

    return await res.json();
}
