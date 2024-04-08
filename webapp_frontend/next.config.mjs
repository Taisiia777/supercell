/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        SERVER_URL : process.env.SERVER_URL,
        API_URL : process.env.API_URL,
    },
    images: {
        formats: ['image/webp'],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "api.mamostore.ru",
                port: ""
            },
            {
                protocol: "http",
                hostname: "api.mamostore.ru",
                port: ""
            },
        ]
    },
}
export default nextConfig;
