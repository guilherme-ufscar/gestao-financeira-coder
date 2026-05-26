FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY web/package.json ./web/
COPY server/package.json ./server/
COPY worker/package.json ./worker/
RUN npm ci --workspace=web

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/web/node_modules ./web/node_modules
COPY web/ ./web/
COPY logo.svg ./web/public/logo.svg
COPY favicon.svg ./web/public/favicon.svg
WORKDIR /app/web
RUN npm run build

FROM nginx:alpine AS production
COPY --from=build /app/web/dist /usr/share/nginx/html
COPY nginx/spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
