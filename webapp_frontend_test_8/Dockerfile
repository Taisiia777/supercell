FROM node:20-alpine

EXPOSE 3000
ENV NEXT_TELEMETRY_DISABLED 1
ARG API_URL
ENV API_URL $API_URL

WORKDIR /app
COPY ["package.json", "package-lock.json", "tsconfig.json", "next.config.mjs", "./"]
RUN npm ci
# RUN npm i sharp
COPY . .

RUN npm run build

ENTRYPOINT npm start
