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
                hostname: "supercell.ecorp.fyi",
                port: ""
            },
            {
                protocol: "http",
                hostname: "supercell.ecorp.fyi",
                port: ""
            },
        ]
    },
}
export default nextConfig;
