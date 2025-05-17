Инструкция по запуску Docker контейнера admin_frontend
Предварительные требования

Установленный Docker Engine
Установленный Docker Compose
Файл docker-compose.yml в корневой директории проекта
Dockerfile для сервиса admin_frontend

Шаги по запуску
1. Сборка образа контейнера
bashCopydocker compose build admin_frontend
Эта команда:

Читает конфигурацию из docker-compose.yml
Находит секцию для сервиса admin_frontend
Использует соответствующий Dockerfile для сборки образа
Устанавливает все зависимости и выполняет инструкции из Dockerfile
Создает готовый к использованию образ

2. Запуск контейнера
bashCopydocker compose up -d admin_frontend
Эта команда:

Запускает контейнер на основе собранного образа
Флаг -d (detached mode) запускает контейнер в фоновом режиме
Настраивает сети и тома согласно docker-compose.yml
Применяет все переменные окружения и другие настройки

Полезные команды для управления

Просмотр логов контейнера:

bashCopydocker compose logs admin_frontend

Остановка контейнера:

bashCopydocker compose stop admin_frontend

Удаление контейнера:

bashCopydocker compose down admin_frontend
Возможные проблемы и их решение

Если сборка не удается:

Проверьте наличие всех необходимых файлов
Убедитесь, что Dockerfile корректно написан
Проверьте права доступа к файлам


Если контейнер не запускается:

Проверьте логи командой docker compose logs
Убедитесь, что порты не заняты другими сервисами
Проверьте корректность переменных окружения


Если контейнер запускается, но приложение недоступно:

Проверьте настройки сети в docker-compose.yml
Убедитесь, что все зависимые сервисы запущены
Проверьте файрвол и настройки безопасности

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
# Mamo_front_webapp
