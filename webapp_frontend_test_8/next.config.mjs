
/** @type {import('next').NextConfig} */
const nextConfig = {
    // Базовый путь для деплоя на поддиректорию /test
    basePath: process.env.BASE_PATH || '/test',
    
    // Префикс для статических ресурсов
    assetPrefix: process.env.BASE_PATH ? `${process.env.BASE_PATH}/` : '/test/',

    env: {
        SERVER_URL: process.env.SERVER_URL,
        API_URL: process.env.API_URL,
        BASE_PATH: process.env.BASE_PATH || '/test',
    },
    
    // Настройки изображений
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

    // Перенаправления для корректной работы в поддиректории
    async rewrites() {
        return [
            {
                source: `${process.env.BASE_PATH || '/test'}/:path*`,
                destination: '/:path*',
            },
        ];
    },

    // Настройки webpack
    webpack: (config, { isServer }) => {
        return config;
    },
}

export default nextConfig;
// /** @type {import('next').NextConfig} */
// const nextConfig = {
//     env: {
//         SERVER_URL : process.env.SERVER_URL,
//         API_URL : process.env.API_URL,
//     },
//     images: {
//         formats: ['image/webp'],
//         remotePatterns: [
//             {
//                 protocol: "https",
//                 hostname: "api.mamostore.ru",
//                 port: ""
//             },
//             {
//                 protocol: "http",
//                 hostname: "api.mamostore.ru",
//                 port: ""
//             },
//         ]
//     },
// }
// export default nextConfig;