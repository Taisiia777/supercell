export async function getProfile(token?: string) {
    const res = await fetch(process.env.API_URL + "customer/me", {
        headers: {
            method: "GET",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        cache: "no-cache",
    })

    return await res.json()
}