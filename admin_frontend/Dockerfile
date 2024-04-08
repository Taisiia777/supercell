FROM node:20-alpine AS builder



WORKDIR /app
COPY ["package.json", "package-lock.json", "tsconfig.json", "tsconfig.node.json", "vite.config.ts", ".eslintrc.cjs", "./"]
RUN npm ci
COPY . .

RUN npm run build

FROM nginx:1.22-alpine-slim
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist/ /var/www/frontend/
